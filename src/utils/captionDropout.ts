/**
 * Implements the caption dropout logic as found in sd-scripts
 */

/**
 * Applies caption dropout to a given caption string
 * 
 * @param caption The caption text to process
 * @param dropoutRate The probability of dropping out individual tags (0 to 1)
 * @param keepTokens Number of tokens to keep at beginning (won't be dropped)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator used between caption tokens
 * @returns Processed caption after dropout
 */
export function applyCaptionDropout(
  caption: string,
  dropoutRate: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = "|",
  captionSeparator: string = ","
): string {
  if (dropoutRate <= 0) {
    return caption;
  }

  // Handle full caption dropout (entire caption becomes empty)
  // This is handled separately in the original code
  // We're only implementing tag dropout here
  
  let fixedTokens: string[] = [];
  let flexTokens: string[] = [];
  let fixedSuffixTokens: string[] = [];

  // Process keep tokens sections using the separator
  if (keepTokensSeparator && caption.includes(keepTokensSeparator)) {
    const parts = caption.split(keepTokensSeparator);
    
    // Handle fixed part (beginning)
    const fixedPart = parts[0];
    fixedTokens = fixedPart
      .split(captionSeparator)
      .map(t => t.trim())
      .filter(t => t);
    
    // Handle flex part (middle, can be dropped)
    let flexPart = parts[1];
    
    // Handle fixed suffix part (end) if present
    if (parts.length > 2 || (parts.length > 1 && flexPart.includes(keepTokensSeparator))) {
      // If there's a second keep_tokens_separator
      if (flexPart.includes(keepTokensSeparator)) {
        const flexParts = flexPart.split(keepTokensSeparator);
        flexPart = flexParts[0];
        const fixedSuffixPart = flexParts[1];
        
        fixedSuffixTokens = fixedSuffixPart
          .split(captionSeparator)
          .map(t => t.trim())
          .filter(t => t);
      } else if (parts.length > 2) {
        const fixedSuffixPart = parts[2];
        fixedSuffixTokens = fixedSuffixPart
          .split(captionSeparator)
          .map(t => t.trim())
          .filter(t => t);
      }
    }
    
    flexTokens = flexPart
      .split(captionSeparator)
      .map(t => t.trim())
      .filter(t => t);
  } else {
    // No keep_tokens_separator, use the keepTokens count
    const tokens = caption
      .split(captionSeparator)
      .map(t => t.trim())
      .filter(t => t);
    
    if (keepTokens > 0) {
      fixedTokens = tokens.slice(0, keepTokens);
      flexTokens = tokens.slice(keepTokens);
    } else {
      flexTokens = tokens;
    }
  }

  // Apply dropout to flex tokens
  const droppedFlexTokens = flexTokens.filter(() => Math.random() >= dropoutRate);
  
  // Join everything back together
  return [...fixedTokens, ...droppedFlexTokens, ...fixedSuffixTokens].join(", ");
}

/**
 * Simulates caption dropout steps for visualization
 * 
 * @param caption The original caption
 * @param dropoutRate The dropout rate to apply
 * @param numSteps How many simulated steps to run
 * @param keepTokens Number of tokens to keep at beginning
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator used between caption tokens
 * @returns Array of resulting captions after each step
 */
export function simulateDropoutSteps(
  caption: string,
  dropoutRate: number,
  numSteps: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = "|",
  captionSeparator: string = ","
): string[] {
  const results: string[] = [];
  
  for (let i = 0; i < numSteps; i++) {
    results.push(
      applyCaptionDropout(
        caption,
        dropoutRate,
        keepTokens,
        keepTokensSeparator,
        captionSeparator
      )
    );
  }
  
  return results;
} 