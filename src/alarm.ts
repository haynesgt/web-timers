function roundTo(x: number, n: number) {
  return Math.round(x / n) * n;
}

export class Alarm {
  audioCtx: AudioContext;
  nodes: AudioNode[];
  gainNode: GainNode;
  compressor: DynamicsCompressorNode;

  // use oscillators to play an alarm
  constructor() {
    this.audioCtx = new AudioContext();

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.audioCtx.destination);

    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.connect(this.gainNode);

    this.nodes = [];
  }

  // play the alarm
  play() {
    const oldVal = this.gainNode.gain.value;
    this.cancel();
    this.gainNode.gain.setValueAtTime(oldVal, this.audioCtx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + .1);

    this.nodes = _.range(8).map(i => {
      const startTime = this.audioCtx.currentTime + i * Math.random();
      const endTime = startTime + 2;
      // const midTime = (startTime + endTime) / 2;

      const gain = this.audioCtx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(gain.gain.value, startTime);
      gain.gain.linearRampToValueAtTime(0.5 * (1 - i / 10), startTime + .01);
      gain.gain.linearRampToValueAtTime(0, endTime);

      const oscillator = this.audioCtx.createOscillator();
      oscillator.type = 'sawtooth';
      //oscillator.frequency.value = 2000 * (2 ** (2 * roundTo(Math.random() * 2 - 1, 1/12)));
      oscillator.frequency.value = 2000 * roundTo(Math.random() * 2 - 1, 1/12);
  
      oscillator.frequency.setValueAtTime(oscillator.frequency.value, startTime);
      // oscillator.frequency.linearRampToValueAtTime(oscillator.frequency.value * (2 ** (Math.random() * 2 - 1)), midTime);
      // oscillator.frequency.linearRampToValueAtTime(oscillator.frequency.value * (2 ** Math.round(Math.random() * 2 - 1)), endTime);

      oscillator.connect(gain);
      oscillator.start();

      gain.connect(this.compressor);
      return gain;
    });
  }

  cancel() {
    this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.nodes.forEach(node => {
      if (node instanceof GainNode && (node.gain.value == 0 || this.gainNode.gain.value === 0)) {
        node.disconnect();
      }
    });
    this.nodes = this.nodes.filter(node => !(node instanceof GainNode) || node.gain.value > 0);
  }

  stop() {
    this.cancel();
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
  }
}