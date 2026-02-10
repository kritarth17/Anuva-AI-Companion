export function startSTT(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('Speech Recognition not supported in this browser'));
      return;
    }
    const r = new SpeechRecognition();
    r.lang = 'en-US';
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => console.log('[STT] listening...');
    r.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      resolve(transcript);
    };
    r.onerror = (e: any) => {
      console.error('[STT] error', e.error);
      reject(new Error(e.error));
    };
    r.start();
  });
}
