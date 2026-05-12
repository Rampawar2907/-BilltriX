'use server';
/**
 * @fileOverview This file implements a Genkit flow for intelligently suggesting existing customer or vendor parties.
 *
 * - suggestPartyDetails - A function that suggests parties based on a partial or misspelled name.
 * - SuggestPartyDetailsInput - The input type for the suggestPartyDetails function.
 * - SuggestPartyDetailsOutput - The return type for the suggestPartyDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PartyDetailsSchema = z.object({
  name: z.string().describe('The full business name of the party.'),
  gstin: z.string().optional().describe('GSTIN of the party.'),
  pan: z.string().optional().describe('PAN of the party.'),
  address: z.string().optional().describe('Full address of the party.'),
  city: z.string().optional().describe('City of the party\'s address.'),
  state: z.string().optional().describe('State of the party\'s address.'),
  pin: z.string().optional().describe('PIN code of the party\'s address.'),
  mobileNumber: z.string().optional().describe('Mobile number of the party.'),
  mailId: z.string().optional().describe('Email ID of the party.'),
  website: z.string().optional().describe('Website of the party.'),
});

const SuggestPartyDetailsInputSchema = z.object({
  partialPartyName: z.string().describe('The partial or potentially misspelled name of the party the user is searching for.'),
  existingParties: z.array(PartyDetailsSchema).describe('A comprehensive list of all existing customer and vendor parties, including their full details, to match against.'),
});
export type SuggestPartyDetailsInput = z.infer<typeof SuggestPartyDetailsInputSchema>;

const SuggestPartyDetailsOutputSchema = z.object({
  suggestedParties: z.array(PartyDetailsSchema).describe('A list of suggested parties from the existingParties that best match the partialPartyName, including their full details.'),
});
export type SuggestPartyDetailsOutput = z.infer<typeof SuggestPartyDetailsOutputSchema>;

export async function suggestPartyDetails(input: SuggestPartyDetailsInput): Promise<SuggestPartyDetailsOutput> {
  return suggestPartyDetailsFlow(input);
}

const suggestPartyDetailsPrompt = ai.definePrompt({
  name: 'suggestPartyDetailsPrompt',
  input: { schema: SuggestPartyDetailsInputSchema },
  output: { schema: SuggestPartyDetailsOutputSchema },
  prompt: `You are an intelligent business assistant designed to help users quickly find existing customer or vendor parties.
The user will provide a partial or possibly misspelled party name and a JSON array of all known existing parties.
Your task is to identify the best matching parties from the provided list based on the partial name.

Consider the following rules:
- Prioritize exact matches or very close phonetic/spelling matches.
- Handle partial inputs gracefully, matching the start or significant parts of party names.
- Do not suggest parties that are not present in the 'existingParties' list.
- Return the full details of the suggested parties as they were provided in the input, in the exact JSON format specified in the output schema.
- If no good matches are found, return an empty array for 'suggestedParties'.

Partial Party Name to match: "{{{partialPartyName}}}"

Existing Parties (JSON array):
{{{json existingParties}}}`,
});

const suggestPartyDetailsFlow = ai.defineFlow(
  {
    name: 'suggestPartyDetailsFlow',
    inputSchema: SuggestPartyDetailsInputSchema,
    outputSchema: SuggestPartyDetailsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await suggestPartyDetailsPrompt(input);
      return output!;
    } catch (error) {
      console.error('Genkit Party Suggestion Error:', error);
      // Fail-soft: return empty suggestions if AI is unavailable or rate-limited
      return { suggestedParties: [] };
    }
  }
);
