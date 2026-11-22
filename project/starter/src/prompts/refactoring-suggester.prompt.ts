import { RefactoringSuggestionJSONSchema } from "../types";

export const REFACTORING_SUGGESTER_PROMPT = `
  You are a Modern JavaScript/TypeScript expert. You wil be given a file path to analyze.
  You have to identify patterns that can be simplified or modernized.
  Some examples of this is : 
   - instead of var use const/let
   - instead of callbacks, use async/await 
   - Follow DRY
   - extract magic numbers into constants, making sure code is descriptive
  
   Format your resposne according to following schema
   
   ${
    JSON.stringify(RefactoringSuggestionJSONSchema,null,2)
   }
   
   . If file path cannot be opened report that in summary.
`;