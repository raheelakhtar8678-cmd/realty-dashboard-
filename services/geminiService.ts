import { GoogleGenAI } from "@google/genai";
import { Transaction, DashboardMetrics } from '../types';

export const analyzePortfolio = async (
  transactions: Transaction[],
  metrics: DashboardMetrics
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure the environment to use AI features.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a senior financial advisor for a Real Estate Agent.
    Analyze the following financial data and provide a concise, professional summary (max 150 words) 
    with 3 bullet points on risks or opportunities. Focus on cash flow, expense ratios, and pipeline health.

    Financial Data:
    - Net Income: $${metrics.netIncome.toLocaleString()}
    - Total Revenue: $${metrics.totalIncome.toLocaleString()}
    - Total Expenses: $${metrics.totalExpense.toLocaleString()}
    - Pending Commissions: $${metrics.pendingCommissions.toLocaleString()}
    - Transaction Count: ${transactions.length}
    - Recent Activity: ${transactions.slice(0, 5).map(t => `${t.date}: ${t.description} ($${t.amount})`).join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Low latency
      }
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate AI analysis at this time. Please check your connection or API limit.";
  }
};