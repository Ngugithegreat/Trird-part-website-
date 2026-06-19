'use server';
/**
 * @fileOverview An AI agent that generates trading signals with confidence levels and explanations.
 *
 * - generateTradingSignal - A function that handles the trading signal generation process.
 * - GenerateTradingSignalInput - The input type for the generateTradingSignal function.
 * - GenerateTradingSignalOutput - The return type for the generateTradingSignal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTradingSignalInputSchema = z.object({
  symbol: z.string().describe('The trading symbol for which to generate a signal (e.g., \'VOL 10\').'),
  ticks: z
    .array(z.number())
    .describe('An array of the most recent historical tick prices for the symbol, ordered from newest to oldest.'),
});
export type GenerateTradingSignalInput = z.infer<typeof GenerateTradingSignalInputSchema>;

const GenerateTradingSignalOutputSchema = z.object({
  direction: z
    .enum(['CALL', 'PUT'])
    .describe('The recommended trading direction: CALL for price to rise, PUT for price to fall.'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('A confidence score (0-100) for the generated signal, where 100 is the highest confidence.'),
  explanation: z
    .string()
    .describe('A concise, professional explanation for the generated signal and confidence level, referencing observed market patterns.'),
});
export type GenerateTradingSignalOutput = z.infer<typeof GenerateTradingSignalOutputSchema>;

export async function generateTradingSignal(
  input: GenerateTradingSignalInput
): Promise<GenerateTradingSignalOutput> {
  return generateTradingSignalFlow(input);
}

const generateTradingSignalPrompt = ai.definePrompt({
  name: 'generateTradingSignalPrompt',
  input: {schema: GenerateTradingSignalInputSchema},
  output: {schema: GenerateTradingSignalOutputSchema},
  prompt: `You are an expert financial analyst specializing in volatility indices, providing trading signals for the \`{{{symbol}}}\` market. Your task is to analyze the provided historical tick data, identify a clear trend, determine a trading direction, assign a confidence level, and explain your reasoning.

The \`ticks\` array contains the most recent price points for the \`{{{symbol}}}\`. The prices are ordered from newest to oldest.

-   A 'CALL' signal indicates an expectation for the price to rise.
-   A 'PUT' signal indicates an expectation for the price to fall.

Consider the short-term trend based on the latest tick data. Provide a concise, professional explanation of your analysis, referencing specific price movements or patterns you observe. Focus on clarity and actionable insights.

Tick Data for \`{{{symbol}}}\` (newest to oldest): {{{ticks}}}`,
});

const generateTradingSignalFlow = ai.defineFlow(
  {
    name: 'generateTradingSignalFlow',
    inputSchema: GenerateTradingSignalInputSchema,
    outputSchema: GenerateTradingSignalOutputSchema,
  },
  async input => {
    const {output} = await generateTradingSignalPrompt(input);
    return output!;
  }
);
