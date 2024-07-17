export default class Ball {
	constructor() {
		this.position = {x : 0.5 * canvas.width, y : 0.5 * canvas.height}
		this.radius = (0.01) * canvas.width
	}

	draw() {
		ctx.fillStyle = 'white'
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
	}
}