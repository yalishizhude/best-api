export default class Probability {
  private probas: number[] = []
  private functions: any = []
  constructor(args: any[]) {
    let sum = 0
    args.concat([{ p: 0, f: () => { } }]).forEach((item: any, i) => {
      let p = Math.abs(parseFloat(item.p)),
        f = item.f
      if (isNaN(p) || typeof f !== 'function') {
        throw new TypeError('Probability.js: Invalid probability object in argument ' + i + '.')
      }
      if (/%/.test(item.p)) {
        p = p / 100.0
      }
      sum += p
      if (sum > 1.0) {
        throw new TypeError('Probability.js: Probability exceeds "1.0" (=100%) in argument ' + i + ': p="' + p + '" (=' + p * 100 + '%), sum="' + sum + '" (=' + sum * 100 + '%).')
      }
      this.probas[i] = sum;
      this.functions[i] = f;
    })
  }
  roll() {
    let random = Math.random();
    let fn = () => { }
    for (let i = 0; i < this.probas.length; i++) {
      if (random >= this.probas[i] && random < this.probas[i + 1]) {
        fn = this.functions[i]
      }
    }
    return fn.apply(this, arguments);
  }
}
