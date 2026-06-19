export type SignalDirection = 'CALL' | 'PUT';

export function calculateLocalSignal(ticks: number[]) {
  if (ticks.length < 5) return { direction: 'CALL' as SignalDirection, confidence: 50, underFive: false };

  const last5 = ticks.slice(0, 5);
  const last20 = ticks.slice(0, 20);
  
  // Direction based on last 5 ticks movement
  let ups = 0;
  for (let i = 0; i < last5.length - 1; i++) {
    if (last5[i] >= last5[i+1]) ups++;
  }
  const direction: SignalDirection = ups >= 2 ? 'CALL' : 'PUT';
  
  // Confidence based on consistency in last 20
  let consistency = 0;
  for (let i = 0; i < last20.length - 1; i++) {
    const wasUp = last20[i] >= last20[i+1];
    if ((direction === 'CALL' && wasUp) || (direction === 'PUT' && !wasUp)) consistency++;
  }
  
  const confidence = Math.min(98, Math.max(45, Math.round((consistency / 20) * 100)));
  const underFive = Math.random() > 0.6; // Mock "Under $5" probability

  return { direction, confidence, underFive };
}