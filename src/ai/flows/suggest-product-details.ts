'use server';
/**
 * @fileOverview An AI agent that suggests existing products and HSN codes based on a user's search term.
 *
 * - suggestProductDetails - A function that handles product and HSN code suggestion.
 * - ProductSuggestionInput - The input type for the suggestProductDetails function.
 * - ProductSuggestionOutput - The return type for the suggestProductDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductDetailSchema = z.object({
  name: z.string().describe('The name of the product.'),
  description: z.string().optional().describe('A brief description of the product.'),
  hsnCode: z.string().describe('The Harmonized System of Nomenclature (HSN) code for the product.'),
  price: z.number().describe('The selling price of the product.'),
  itemCode: z.string().optional().describe('An internal item code for the product.'),
  barcode: z.string().optional().describe('The barcode associated with the product.'),
});

const ProductSuggestionInputSchema = z.object({
  productSearchTerm: z.string().describe('The partial or full name of the product the user is typing.'),
  existingProducts: z.array(ProductDetailSchema).describe('A list of all currently saved products with their details.').optional().default([]),
});
export type ProductSuggestionInput = z.infer<typeof ProductSuggestionInputSchema>;

const ProductSuggestionOutputSchema = z.object({
  suggestedProducts: z.array(ProductDetailSchema).describe('A list of suggested existing products matching the search term.'),
  suggestedHsnCode: z.string().nullable().describe('An intelligently suggested HSN code (6-digit) for a new product, or null if existing products were suggested.'),
});
export type ProductSuggestionOutput = z.infer<typeof ProductSuggestionOutputSchema>;

export async function suggestProductDetails(input: ProductSuggestionInput): Promise<ProductSuggestionOutput> {
  return suggestProductDetailsFlow(input);
}

const productSuggestionPrompt = ai.definePrompt({
  name: 'productSuggestionPrompt',
  input: { schema: ProductSuggestionInputSchema },
  output: { schema: ProductSuggestionOutputSchema },
  prompt: `You are an AI assistant designed to help a business user efficiently add products to an invoice.
The user is typing a product name: "{{{productSearchTerm}}}".

Here is a list of existing products in the system:
{{#if existingProducts}}
{{#each existingProducts}}
- Name: {{{this.name}}}
  Description: {{{this.description}}}
  HSN Code: {{{this.hsnCode}}}
  Price: {{{this.price}}}
  Item Code: {{{this.itemCode}}}
  Barcode: {{{this.barcode}}}
{{/each}}
{{else}}
No existing products are available.
{{/if}}

Based on the user's input ("{{{productSearchTerm}}}") and the list of existing products, perform the following:

1.  **Product Matching**: Search the 'existingProducts' list for any products whose 'name' or 'description' are similar to or contain the 'productSearchTerm'.
    *   If you find one or more good matches (e.g., the search term is a substring, a close synonym, or a strong conceptual match), include these full product details in the 'suggestedProducts' array.
    *   Prioritize exact or near-exact name matches.
2.  **HSN Code Suggestion (for new products)**:
    *   If no suitable existing products are found in the 'existingProducts' list, or if the user's search term strongly implies a new product, then intelligently suggest a relevant 6-digit Harmonized System of Nomenclature (HSN) code based on the 'productSearchTerm'.
    *   Provide only the 6-digit HSN code as a string, or null if existing products were suggested.

Return your response in a JSON object strictly conforming to the output schema.
`,
});

const suggestProductDetailsFlow = ai.defineFlow(
  {
    name: 'suggestProductDetailsFlow',
    inputSchema: ProductSuggestionInputSchema,
    outputSchema: ProductSuggestionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await productSuggestionPrompt(input);
      return output!;
    } catch (error) {
      console.error('Genkit Product Suggestion Error:', error);
      // Fail-soft: return empty suggestions if AI is unavailable or rate-limited
      return { suggestedProducts: [], suggestedHsnCode: null };
    }
  }
);
