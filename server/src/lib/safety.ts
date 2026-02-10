// Post-filter: checks LLM response for unsafe content after generation.
export function enforceSafetyPost(text: string): boolean {
  if (!text) return false;
  // Flag romantic/sexual/harmful content in responses
  const bannedPatterns = [
    /i love you|i'm in love|romantic|dating you|exclusive relationship|sexually|intimate/i,
    /harm yourself|take your life|end yourself|suicide|self-harm/i,
  ];
  return bannedPatterns.some(rx => rx.test(text));
}

// Sanitize response: replace unsafe phrases with safe alternatives.
export function sanitizeResponse(text: string): string {
  let result = text;
  result = result.replace(/i love you|i'm in love with you/gi, 'I care about you');
  result = result.replace(/exclusive relationship|dating you|romantic partner/gi, 'friend and companion');
  result = result.replace(/sexually|intimate|romantic feelings/gi, 'supportive');
  return result;
}
