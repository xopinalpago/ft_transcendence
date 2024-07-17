export default class Paddle {
	constructor({position}) {
		this.position = position
		this.velocity = {x : 0, y : 0}
		this.height = 0.1 * canvas.height
		this.width = 0.01 * canvas.width
	}

	draw() {
		ctx.fillStyle = 'white'
		ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
	}
}
