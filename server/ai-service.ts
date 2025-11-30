import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Google Gemini client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export type AIProvider = "openai" | "gemini";

export interface ProposalGenerationRequest {
  clientName: string;
  clientIndustry?: string;
  services: string[];
  projectGoals?: string;
  budget?: string;
  timeline?: string;
  additionalContext?: string;
}

export interface ContractGenerationRequest {
  clientName: string;
  services: string[];
  contractValue: number;
  startDate: string;
  endDate?: string;
  paymentTerms?: string;
  additionalContext?: string;
}

export interface AIGenerationResult {
  success: boolean;
  content?: string;
  error?: string;
  provider: AIProvider;
}

// Proposal generation prompt
function buildProposalPrompt(request: ProposalGenerationRequest): string {
  return `You are a professional proposal writer for a digital marketing agency. Generate a compelling, professional proposal based on the following details:

Client Name: ${request.clientName}
Industry: ${request.clientIndustry || "Not specified"}
Services Requested: ${request.services.join(", ")}
Project Goals: ${request.projectGoals || "Not specified"}
Budget Range: ${request.budget || "To be discussed"}
Timeline: ${request.timeline || "To be discussed"}
Additional Context: ${request.additionalContext || "None"}

Please generate a professional proposal that includes:

1. **Executive Summary** (2-3 paragraphs)
   - Brief introduction about understanding their needs
   - High-level overview of proposed solutions
   - Expected outcomes and value proposition

2. **Understanding Your Needs**
   - Analysis of their industry challenges
   - Specific pain points we can address
   - Opportunities for growth

3. **Proposed Services** (for each service)
   - Service description
   - Key deliverables (bullet points)
   - Expected outcomes/KPIs
   - Timeline estimate

4. **Why Choose Us**
   - Our expertise and experience
   - Unique value proposition
   - Client success approach

5. **Next Steps**
   - Clear call to action
   - Timeline for getting started

Write in a professional but friendly tone. Be specific and avoid generic statements. Focus on value and outcomes rather than just listing features.

Format the output in clean, readable sections with markdown headers.`;
}

// Contract scope generation prompt
function buildContractPrompt(request: ContractGenerationRequest): string {
  return `You are a professional contract writer for a digital marketing agency. Generate professional contract content based on the following details:

Client Name: ${request.clientName}
Services: ${request.services.join(", ")}
Contract Value: ₹${request.contractValue.toLocaleString()}
Start Date: ${request.startDate}
End Date: ${request.endDate || "Ongoing"}
Payment Terms: ${request.paymentTerms || "To be specified"}
Additional Context: ${request.additionalContext || "None"}

Please generate the following contract sections:

1. **Scope of Work**
   - Detailed description of all services to be provided
   - Specific activities and responsibilities
   - What is included and what is excluded

2. **Deliverables**
   - List of all tangible deliverables
   - Quality standards and specifications
   - Delivery schedule and milestones

3. **Terms and Conditions**
   - Payment schedule and terms
   - Revision policy
   - Intellectual property rights
   - Communication expectations

4. **Confidentiality Clause**
   - Non-disclosure obligations
   - Data protection commitments
   - Duration of confidentiality

5. **Termination Clause**
   - Termination conditions
   - Notice period requirements
   - Settlement of dues on termination

Write in formal, legally-appropriate language while remaining clear and understandable. Be specific about obligations and expectations.

Format the output in clean sections with markdown headers.`;
}

// Generate content using OpenAI
async function generateWithOpenAI(prompt: string): Promise<AIGenerationResult> {
  if (!openai) {
    return {
      success: false,
      error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
      provider: "openai",
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for best quality
      messages: [
        {
          role: "system",
          content: "You are a professional business proposal and contract writer for a digital marketing agency. Write clear, compelling, and professional content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: "No content generated from OpenAI",
        provider: "openai",
      };
    }

    return {
      success: true,
      content,
      provider: "openai",
    };
  } catch (error: any) {
    console.error("OpenAI generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate content with OpenAI",
      provider: "openai",
    };
  }
}

// Generate content using Google Gemini
async function generateWithGemini(prompt: string): Promise<AIGenerationResult> {
  if (!genAI) {
    return {
      success: false,
      error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.",
      provider: "gemini",
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a professional business proposal and contract writer for a digital marketing agency. Write clear, compelling, and professional content.\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    });

    const content = result.response.text();
    if (!content) {
      return {
        success: false,
        error: "No content generated from Gemini",
        provider: "gemini",
      };
    }

    return {
      success: true,
      content,
      provider: "gemini",
    };
  } catch (error: any) {
    console.error("Gemini generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate content with Gemini",
      provider: "gemini",
    };
  }
}

// Main generation function
export async function generateProposalContent(
  request: ProposalGenerationRequest,
  provider: AIProvider
): Promise<AIGenerationResult> {
  const prompt = buildProposalPrompt(request);

  if (provider === "openai") {
    return generateWithOpenAI(prompt);
  } else {
    return generateWithGemini(prompt);
  }
}

export async function generateContractContent(
  request: ContractGenerationRequest,
  provider: AIProvider
): Promise<AIGenerationResult> {
  const prompt = buildContractPrompt(request);

  if (provider === "openai") {
    return generateWithOpenAI(prompt);
  } else {
    return generateWithGemini(prompt);
  }
}

// Check which AI providers are available
export function getAvailableProviders(): { openai: boolean; gemini: boolean } {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  };
}

// Proposal templates
export const PROPOSAL_TEMPLATES = {
  SOCIAL_MEDIA_MARKETING: {
    id: "social-media-marketing",
    name: "Social Media Marketing",
    description: "Complete social media management and growth strategy",
    icon: "📱",
    services: ["SOCIAL_MEDIA", "CONTENT_MARKETING"],
    executiveSummary: `We are excited to present our comprehensive social media marketing proposal designed to elevate your brand's digital presence and drive meaningful engagement with your target audience.

Our approach combines strategic content creation, community management, and data-driven optimization to deliver measurable results. We understand that social media is not just about posting content—it's about building relationships, establishing thought leadership, and driving business growth.

With our proven methodology and dedicated team, we will transform your social media channels into powerful marketing assets that generate leads, build brand loyalty, and contribute to your bottom line.`,
    defaultServices: [
      {
        serviceType: "SOCIAL_MEDIA",
        name: "Social Media Management",
        description: "Full-service social media management including content creation, scheduling, community management, and performance analytics across all major platforms.",
        deliverables: [
          "20 custom posts per month per platform",
          "Daily community management and engagement",
          "Monthly analytics and performance reports",
          "Content calendar and strategy document",
          "Hashtag research and optimization",
        ],
        kpis: [
          "Follower growth rate",
          "Engagement rate improvement",
          "Reach and impressions",
          "Click-through rate",
        ],
        price: 25000,
        timeline: "Ongoing monthly",
      },
      {
        serviceType: "CONTENT_MARKETING",
        name: "Content Strategy & Creation",
        description: "Strategic content development including graphics, videos, and copywriting tailored to your brand voice and audience preferences.",
        deliverables: [
          "Brand content guidelines document",
          "Monthly content themes and pillars",
          "Custom graphics and visual assets",
          "Video content (2-4 per month)",
          "Caption and copy library",
        ],
        kpis: [
          "Content engagement metrics",
          "Share and save rates",
          "Brand mention growth",
        ],
        price: 15000,
        timeline: "Ongoing monthly",
      },
    ],
    termsAndConditions: `1. Content Approval: All content will be submitted for client approval 48 hours before scheduled posting.
2. Revisions: Each piece of content includes up to 2 rounds of revisions.
3. Platform Access: Client will provide admin/editor access to all social media accounts.
4. Response Time: Community management responses within 4 business hours during working days.
5. Reporting: Monthly performance reports delivered by the 5th of each month.
6. Content Ownership: All created content becomes client property upon full payment.`,
  },

  PAID_ADVERTISING: {
    id: "paid-advertising",
    name: "Paid Advertising Campaign",
    description: "Performance-driven paid ads across Google, Meta, and LinkedIn",
    icon: "📢",
    services: ["PAID_ADS"],
    executiveSummary: `We propose a results-driven paid advertising strategy designed to maximize your return on ad spend (ROAS) and generate qualified leads for your business.

Our team of certified advertising specialists will create, manage, and optimize campaigns across Google Ads, Meta Ads (Facebook & Instagram), and LinkedIn Ads to reach your ideal customers at every stage of the buyer journey.

We combine creative excellence with data-driven optimization to ensure every rupee of your advertising budget works harder. Our transparent reporting keeps you informed of performance, and our continuous optimization ensures ongoing improvement.`,
    defaultServices: [
      {
        serviceType: "PAID_ADS",
        name: "Paid Advertising Management",
        description: "End-to-end management of paid advertising campaigns including strategy, setup, creative development, and ongoing optimization.",
        deliverables: [
          "Campaign strategy and media plan",
          "Ad account setup and configuration",
          "Custom audience creation and targeting",
          "Ad creative design (10+ variations)",
          "A/B testing implementation",
          "Weekly optimization and bid management",
          "Monthly performance reports",
        ],
        kpis: [
          "Cost per lead (CPL)",
          "Return on ad spend (ROAS)",
          "Click-through rate (CTR)",
          "Conversion rate",
          "Quality score improvement",
        ],
        price: 35000,
        timeline: "Ongoing monthly + ad spend",
      },
    ],
    termsAndConditions: `1. Ad Spend: Management fee is separate from ad spend budget. Client is responsible for ad spend directly to platforms.
2. Minimum Commitment: 3-month minimum engagement recommended for optimal results.
3. Creative Approval: All ad creatives require client approval before launch.
4. Reporting: Weekly performance updates and monthly comprehensive reports.
5. Optimization: Continuous optimization included; major strategy pivots may require additional planning time.
6. Platform Access: Client retains ownership of all ad accounts.`,
  },

  SEO_PACKAGE: {
    id: "seo-package",
    name: "SEO & Content Strategy",
    description: "Comprehensive SEO services to improve organic visibility",
    icon: "🔍",
    services: ["SEO", "CONTENT_MARKETING"],
    executiveSummary: `We present our comprehensive SEO and content strategy proposal designed to improve your organic search visibility, drive qualified traffic, and establish your brand as an authority in your industry.

Our holistic approach addresses technical SEO, on-page optimization, content strategy, and link building to create sustainable organic growth. Unlike quick-fix tactics, our methodology focuses on building long-term authority that compounds over time.

With detailed keyword research, competitor analysis, and a content roadmap tailored to your business goals, we'll help you capture search demand and convert visitors into customers.`,
    defaultServices: [
      {
        serviceType: "SEO",
        name: "Search Engine Optimization",
        description: "Comprehensive SEO services including technical audit, on-page optimization, and ongoing monitoring to improve search rankings.",
        deliverables: [
          "Technical SEO audit and fixes",
          "Keyword research and mapping",
          "On-page optimization (10 pages/month)",
          "Schema markup implementation",
          "Monthly ranking reports",
          "Competitor analysis",
          "Google Search Console optimization",
        ],
        kpis: [
          "Organic traffic growth",
          "Keyword ranking improvements",
          "Domain authority increase",
          "Page load speed",
          "Core Web Vitals scores",
        ],
        price: 30000,
        timeline: "Ongoing monthly",
      },
      {
        serviceType: "CONTENT_MARKETING",
        name: "SEO Content Creation",
        description: "Strategic content creation optimized for search engines and designed to attract and engage your target audience.",
        deliverables: [
          "4 SEO-optimized blog posts per month",
          "Content briefs and outlines",
          "Internal linking strategy",
          "Content refresh recommendations",
          "Featured snippet optimization",
        ],
        kpis: [
          "Content traffic growth",
          "Time on page",
          "Bounce rate reduction",
          "Backlinks earned",
        ],
        price: 20000,
        timeline: "Ongoing monthly",
      },
    ],
    termsAndConditions: `1. Timeline: SEO is a long-term strategy. Significant results typically visible within 3-6 months.
2. Content Approval: All content submitted for approval before publishing.
3. Website Access: Client to provide CMS access for on-page implementations.
4. External Factors: Rankings may be affected by algorithm updates and competitor activities.
5. Reporting: Monthly comprehensive reports with actionable insights.
6. Content Ownership: All created content becomes client property.`,
  },

  COMPLETE_DIGITAL_MARKETING: {
    id: "complete-digital-marketing",
    name: "Complete Digital Marketing",
    description: "Full-service digital marketing retainer",
    icon: "🚀",
    services: ["SOCIAL_MEDIA", "PAID_ADS", "SEO", "CONTENT_MARKETING", "EMAIL_SMS"],
    executiveSummary: `We are thrilled to present our comprehensive digital marketing proposal, designed to serve as a complete solution for your brand's online growth and success.

This full-service engagement combines the power of social media marketing, paid advertising, search engine optimization, content marketing, and email automation into a cohesive strategy that drives results across every digital touchpoint.

By consolidating your digital marketing efforts with a single, dedicated team, you benefit from integrated strategy, consistent messaging, efficient budget allocation, and streamlined communication. Our holistic approach ensures all channels work together to maximize your marketing ROI.`,
    defaultServices: [
      {
        serviceType: "SOCIAL_MEDIA",
        name: "Social Media Management",
        description: "Complete social media presence management across key platforms.",
        deliverables: [
          "15 posts per month per platform",
          "Community management",
          "Monthly reports",
        ],
        kpis: ["Engagement rate", "Follower growth"],
        price: 20000,
        timeline: "Monthly",
      },
      {
        serviceType: "PAID_ADS",
        name: "Paid Advertising",
        description: "Performance marketing campaigns across Google and Meta.",
        deliverables: [
          "Campaign management",
          "Ad creative development",
          "Weekly optimization",
        ],
        kpis: ["ROAS", "CPL"],
        price: 25000,
        timeline: "Monthly + ad spend",
      },
      {
        serviceType: "SEO",
        name: "SEO Services",
        description: "Ongoing search engine optimization and monitoring.",
        deliverables: [
          "Technical SEO",
          "On-page optimization",
          "Ranking reports",
        ],
        kpis: ["Organic traffic", "Rankings"],
        price: 20000,
        timeline: "Monthly",
      },
      {
        serviceType: "CONTENT_MARKETING",
        name: "Content Marketing",
        description: "Strategic content creation for all channels.",
        deliverables: [
          "Blog posts",
          "Social content",
          "Email content",
        ],
        kpis: ["Content engagement", "Traffic"],
        price: 15000,
        timeline: "Monthly",
      },
      {
        serviceType: "EMAIL_SMS",
        name: "Email Marketing",
        description: "Email campaign management and automation.",
        deliverables: [
          "4 email campaigns/month",
          "Automation workflows",
          "List management",
        ],
        kpis: ["Open rate", "Click rate"],
        price: 10000,
        timeline: "Monthly",
      },
    ],
    termsAndConditions: `1. Minimum Commitment: 6-month minimum engagement for comprehensive strategy.
2. Monthly Meetings: Bi-weekly strategy calls and monthly review meetings.
3. Reporting: Comprehensive monthly dashboard with all channel metrics.
4. Priority Support: Dedicated account manager with 24-hour response time.
5. Strategy Reviews: Quarterly strategy review and optimization sessions.
6. Ad Spend: Management fees separate from advertising spend.`,
  },
};

export type ProposalTemplateKey = keyof typeof PROPOSAL_TEMPLATES;
