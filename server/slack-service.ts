import crypto from "crypto";
import type { SlackSettings, InsertSlackAttendanceLog, InsertAttendance } from "../shared/schema";

// Slack Event Types
interface SlackMessageEvent {
  type: "message";
  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
  channel_type: string;
}

interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackMessageEvent;
  type: "event_callback" | "url_verification";
  challenge?: string;
  event_id: string;
  event_time: number;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    display_name?: string;
  };
}

interface SlackChannel {
  id: string;
  name: string;
}

export class SlackService {
  private settings: SlackSettings | null = null;

  setSettings(settings: SlackSettings) {
    this.settings = settings;
  }

  getSettings(): SlackSettings | null {
    return this.settings;
  }

  /**
   * Verify Slack request signature to ensure the request is from Slack
   */
  verifySlackRequest(
    signingSecret: string,
    signature: string,
    timestamp: string,
    rawBody: string
  ): boolean {
    // Prevent replay attacks - reject requests older than 5 minutes
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) {
      console.log("Slack request too old, possible replay attack");
      return false;
    }

    // Create the signature base string
    const sigBaseString = `v0:${timestamp}:${rawBody}`;

    // Create HMAC SHA256 hash
    const mySignature =
      "v0=" +
      crypto
        .createHmac("sha256", signingSecret)
        .update(sigBaseString, "utf8")
        .digest("hex");

    // Compare signatures using timing-safe comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(mySignature, "utf8"),
        Buffer.from(signature, "utf8")
      );
    } catch {
      return false;
    }
  }

  /**
   * Detect if a message contains check-in keywords
   */
  detectCheckIn(messageText: string, keywords: string[]): string | null {
    const lowerMessage = messageText.toLowerCase();
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return null;
  }

  /**
   * Detect if a message contains check-out keywords
   */
  detectCheckOut(messageText: string, keywords: string[]): string | null {
    const lowerMessage = messageText.toLowerCase();
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return null;
  }

  /**
   * Parse Slack message and determine event type
   */
  parseMessage(
    messageText: string,
    checkInKeywords: string[],
    checkOutKeywords: string[]
  ): { eventType: "CHECK_IN" | "CHECK_OUT" | null; keyword: string | null } {
    // Check for check-out first (more specific phrases)
    const checkOutKeyword = this.detectCheckOut(messageText, checkOutKeywords);
    if (checkOutKeyword) {
      return { eventType: "CHECK_OUT", keyword: checkOutKeyword };
    }

    // Check for check-in
    const checkInKeyword = this.detectCheckIn(messageText, checkInKeywords);
    if (checkInKeyword) {
      return { eventType: "CHECK_IN", keyword: checkInKeyword };
    }

    return { eventType: null, keyword: null };
  }

  /**
   * Get current time in HH:mm format
   */
  getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Get today's date at midnight (for attendance record)
   */
  getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Calculate working hours between check-in and check-out times
   */
  calculateWorkingHours(checkIn: string, checkOut: string): { workingHours: number; overtimeHours: number } {
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);

    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    const hours = Math.max(0, totalMinutes / 60);
    const workingHours = Math.min(hours, 8);
    const overtimeHours = Math.max(0, hours - 8);

    return {
      workingHours: Math.round(workingHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100
    };
  }

  /**
   * Fetch Slack user info by user ID
   */
  async fetchSlackUser(userId: string, botToken: string): Promise<SlackUser | null> {
    try {
      const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json() as { ok: boolean; user?: SlackUser; error?: string };

      if (data.ok && data.user) {
        return data.user;
      }
      console.error("Failed to fetch Slack user:", data.error);
      return null;
    } catch (error) {
      console.error("Error fetching Slack user:", error);
      return null;
    }
  }

  /**
   * Fetch all users from Slack workspace
   */
  async fetchSlackUsers(botToken: string): Promise<SlackUser[]> {
    try {
      const response = await fetch("https://slack.com/api/users.list", {
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json() as { ok: boolean; members?: SlackUser[]; error?: string };

      if (data.ok && data.members) {
        // Filter out bots and deleted users
        return data.members.filter((user: any) => !user.is_bot && !user.deleted);
      }
      console.error("Failed to fetch Slack users:", data.error);
      return [];
    } catch (error) {
      console.error("Error fetching Slack users:", error);
      return [];
    }
  }

  /**
   * Fetch all channels from Slack workspace
   */
  async fetchSlackChannels(botToken: string): Promise<SlackChannel[]> {
    try {
      const response = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel", {
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json() as { ok: boolean; channels?: SlackChannel[]; error?: string };

      if (data.ok && data.channels) {
        return data.channels;
      }
      console.error("Failed to fetch Slack channels:", data.error);
      return [];
    } catch (error) {
      console.error("Error fetching Slack channels:", error);
      return [];
    }
  }

  /**
   * Test Slack connection with bot token
   */
  async testConnection(botToken: string): Promise<{ ok: boolean; teamName?: string; teamId?: string; error?: string }> {
    try {
      const response = await fetch("https://slack.com/api/auth.test", {
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json() as { ok: boolean; team?: string; team_id?: string; error?: string };

      if (data.ok) {
        return { ok: true, teamName: data.team, teamId: data.team_id };
      }
      return { ok: false, error: data.error };
    } catch (error) {
      return { ok: false, error: "Failed to connect to Slack API" };
    }
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(botToken: string, channelId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: channelId,
          text,
        }),
      });

      const data = await response.json() as { ok: boolean; error?: string };
      return data.ok;
    } catch (error) {
      console.error("Error sending Slack message:", error);
      return false;
    }
  }

  /**
   * Add a reaction to a message (to acknowledge attendance logging)
   */
  async addReaction(botToken: string, channelId: string, timestamp: string, reaction: string): Promise<boolean> {
    try {
      const response = await fetch("https://slack.com/api/reactions.add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: channelId,
          timestamp,
          name: reaction,
        }),
      });

      const data = await response.json() as { ok: boolean; error?: string };
      return data.ok;
    } catch (error) {
      console.error("Error adding Slack reaction:", error);
      return false;
    }
  }
}

export const slackService = new SlackService();
