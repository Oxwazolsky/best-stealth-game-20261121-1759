// Keyboard state for Night Courier.
// One job: remember which keys are held and turn them into a movement axis.
export const Input = {
  keys: new Set(),

  attach() {
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);
      if (event.code === 'KeyM') window.dispatchEvent(new CustomEvent('nightcourier:mute'));
      if (event.code === 'Enter' || event.code === 'Space') {
        window.dispatchEvent(new CustomEvent('nightcourier:confirm'));
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.keys.clear());
  },

  down(code) {
    return this.keys.has(code);
  },

  // Normalised WASD / arrow-key axis, or {x: 0, y: 0} when idle.
  axis() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  },

  sneaking() {
    return this.down('ShiftLeft') || this.down('ShiftRight');
  },
};
