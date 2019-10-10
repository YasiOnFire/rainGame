new Vue({
	el: '#app',
	data: {
		myp5: null,
		gameOver: false,
		fires: [],
		position: {
			x: 500,
			y: 100
		},
		inGame: false,
		timeLimit: 20,
		timer: null,
		message: '',
		rainColor: '#098bd6',
		score: 0,
		firesExt: 0,
		timelineParameters: null,
		maxY: window.innerHeight - (window.innerHeight / 3.5)
	},
	watch: {
		timeLimit(val) {
			if (val <= 0) {
				clearInterval(this.timer)
				this.gameOver = true
				this.inGame = false
			}
		}
	},
	methods: {
		restartGame() {
			let canv = document.getElementsByTagName('canvas')
			Array.from(canv).forEach((e) => e.remove())
			var interval_id = window.setInterval("", 9999)
			for (var i = 1; i < interval_id; i++)
        window.clearInterval(i);

			this.timelineParameters.loop = false
			this.timelineParameters.autoplay = false
			this.timelineParameters.pause()
			this.inGame = true;
			this.gameOver = false;
			this.myp5 = null;
			this.fires = []
			this.timeLimit = 20
			this.score = 0
			this.firesExt = 0
			this.initGame()
			this.timer = setInterval(() => {
				this.timeLimit -= 1
			}, 1000)
		},
		startGame() {
			this.restartGame();
		},
		getRndInteger(axis, max) {
			if (axis === 'x') {
				return Math.floor(Math.random() * (max))
			} else {
				return Math.floor(Math.random() * (max))
			}
		},
		initDemo() {
			this.timelineParameters = anime.timeline({
				direction: 'alternate',
				loop: true
			})
			this.myp5.mouseDragged()

			this.timelineParameters
				.add({
					targets: this.position,
					x: [this.getRndInteger('x', window.innerWidth), this.getRndInteger('x', window.innerWidth), this.getRndInteger('x', window.innerWidth), this.getRndInteger('x', window.innerWidth)],
					y: [this.getRndInteger('y', this.maxY), this.getRndInteger('y', this.maxY), this.getRndInteger('y', this.maxY), this.getRndInteger('y', this.maxY)],
					duration: 10000,
					easing: 'easeInOutQuad'
				})
		},
		initGame() {
			let _this = this
			let particleSystem = []
			let engine
			let world
			let rain = []
			let inter = null
			const CLOUD_SIZE = window.innerWidth / 10
			const RAIN_COUNT = 110
			const MAX_FIRES = 10
			const RAIN_SIZE = window.innerWidth / 80
			const FIRE_SIZES = [
				window.innerWidth / 20, window.innerWidth / 30
			]
			const Engine = Matter.Engine
			const Render = Matter.Render
			const World = Matter.World
			const Bodies = Matter.Bodies
			const Events = Matter.Events

			if (this.inGame) {
				document.addEventListener('touchmove', (event) => {
					event.preventDefault()
					var touch = event.touches[0]
					this.position.x = touch.clientX
					if (touch.clientY < this.maxY) {
						this.position.y = touch.clientY + 40
					}
				})
				document.addEventListener('mousemove', (event) => {
					this.position.x = event.clientX
					if (event.clientY < this.maxY) {
						this.position.y = event.clientY
					}
				})
			}

			function sketchInit(sketch) {
				sketch.setup = function () {
					sketch.createCanvas(window.innerWidth, window.innerHeight)
					engine = Engine.create()
					world = engine.world
					const render = Render.create({
						element: document.getElementById('canvas_container'),
						engine: engine,
						options: {
							width: window.innerWidth,
							height: window.innerHeight,
							wireframes: false,
							background: 'transparent'
						}
					});

					Render.run(render)
					for (let x = 0; x < MAX_FIRES; x++) {
						let lifespan = sketch.random(...FIRE_SIZES)
						let x = sketch.random(lifespan, window.innerWidth - lifespan)
						_this.fires.push(new Fire(x, lifespan))
						particleSystem.push(new ParticleSystem(sketch.createVector(x, window.innerHeight - lifespan * 2)))
					}

					Events.on(engine, 'collisionStart', function (event) {
						const pairs = event.pairs;
						for (var i = 0; i < pairs.length; i++) {
							var pair = pairs[i];
							if (pair.bodyA.label !== pair.bodyB.label) {
								pair.bodyA.render.fillStyle = 'rgba(255, 100, 0,.8)'
								pair.bodyA.render.strokeStyle = 'rgba(255,0,0,.4)'
								pair.bodyA.render.lineWidth = 5
								// pair.bodyB.render.fillStyle = 'rgba(9, 139, 255, .7)'
								let target = _this.fires.find(el => {
									return el.body.id === pair.bodyA.id
								})
								if (target)
									target.isHit(pair.bodyB.circleRadius)
							}
						}
					});
					Engine.run(engine)
				}

				sketch.draw = function () {
					sketch.clear()
					for (let x = 0; x < RAIN_COUNT; x++) {
						if (rain[x] && rain[x].isOffScreen()) {
							rain[x].removeFromWorld()
							rain.splice(x, 1)
							x--
						}
					}
					for (let x = 0; x < _this.fires.length; x++) {
						if (particleSystem[x]) {
							particleSystem[x].addParticle(_this.fires[x].body.circleRadius)
							particleSystem[x].run(sketch.createVector(_this.fires[x].body.position.x, _this.fires[x].body.position.y - _this.fires[x].body.circleRadius))
						}
						if (_this.fires[x] && !_this.fires[x].isAlive) {
							_this.fires[x].removeFromWorld()
							_this.fires.splice(x, 1)
							particleSystem.splice(x, 1)
							x--
						}
					}
					if (_this.fires.length < MAX_FIRES) {
						let lifespan = sketch.random(...FIRE_SIZES)
						var x
						do {
							x = sketch.random(lifespan, window.innerWidth - lifespan)
						} while ((x - lifespan) < _this.position.x && (x + lifespan) > _this.position.x)
						_this.fires.push(new Fire(x, lifespan))
						particleSystem.push(new ParticleSystem(sketch.createVector(x, window.innerHeight - lifespan * 2)))
					}
					sketch.fill(9, 139, 214)
					sketch.noStroke()
					sketch.ellipse(_this.position.x - CLOUD_SIZE / 1.5, _this.position.y, CLOUD_SIZE * 1.2, CLOUD_SIZE * 1.2)
					sketch.ellipse(_this.position.x, _this.position.y, CLOUD_SIZE, CLOUD_SIZE)
					sketch.ellipse(_this.position.x + CLOUD_SIZE / 1.5, _this.position.y + 2, CLOUD_SIZE / 1.1, CLOUD_SIZE / 1.3)
					sketch.ellipse(_this.position.x + CLOUD_SIZE / 2, _this.position.y - CLOUD_SIZE / 3, CLOUD_SIZE / 2, CLOUD_SIZE / 2)
				}
				sketch.mouseDragged = function () {
					if (inter) return false
					inter = setInterval(() => {
						generateRain()
					}, 10)
				}
				if (_this.inGame) {
					sketch.mousePressed = function () {
						if (inter) return false
						inter = setInterval(() => {
							generateRain()
						}, 10)
					}
					sketch.mouseReleased = function () {
						clearInterval(inter)
						inter = null
					}
				}
				function generateRain() {
					var isGenerating
					if (isGenerating) return false
					rain.push(new Raindrop(_this.position.x, _this.position.y))
					isGenerating = true
					setTimeout(() => {
						isGenerating = false
					}, 20)
				}
				class Raindrop {
					constructor(x, y) {
						this.body = Bodies.circle(sketch.random(x - RAIN_SIZE * 8, x + RAIN_SIZE * 8), sketch.random(y - RAIN_SIZE * 2, y + RAIN_SIZE * 2), sketch.random(2, RAIN_SIZE), {
							// restitution: 0,
							friction: 0,
							frictionAir: 0,
							frictionStatic: 0.1,
							// density: .1,
							label: 'rain',
							render: {
								fillStyle: _this.rainColor
							}
						})
						World.add(world, this.body)
					}
					isOffScreen() {
						const pos = this.body.position
						return (pos.y > window.innerHeight || pos.x < 0 || pos.x > window.innerWidth)
					}
					removeFromWorld() {
						World.remove(world, this.body)
					}
				}
				class Fire {
					constructor(x, lifespan) {
						this.isAlive = true
						this.lifespan = lifespan
						this.body = Bodies.circle(x, window.innerHeight - this.lifespan, this.lifespan, {
							isStatic: true,
							isSensor: true,
							label: 'fire',
							render: {
								fillStyle: 'rgba(252, 151, 0,.8)',
								strokeStyle: 'rgba(255,0,0,.2)',
								lineWidth: 5
							}
						})
						World.add(world, this.body)
					}
					isHit(dropSize) {
						if (this.body.circleRadius > (dropSize) * .5) {
							this.body.circleRadius -= (dropSize) * .5
							this.body.position.y = window.innerHeight - this.body.circleRadius
						} else {
							this.isAlive = false
						}
					}
					removeFromWorld() {
						if (_this.inGame) {
							_this.score += Math.round(this.lifespan)
							_this.firesExt += 1
						}
						World.remove(world, this.body)
					}
				}
				class Particle {
					constructor(position, fireSize) {
						this.acceleration = sketch.createVector(0, (window.innerWidth / 120) * -0.001)
						this.velocity = sketch.createVector(sketch.random(-1, 1), sketch.random(-1, 0))
						this.position = position.copy()
						this.lifespan = 155
						this.randColor = sketch.random(0, 100)
						this.randWidth = sketch.random(FIRE_SIZES[0] / 3, FIRE_SIZES[1] / 3)
						this.randPosX = sketch.random(this.position.x - fireSize, this.position.x + fireSize)
					}
					run() {
						this.update()
						this.display()
					}
					update() {
						this.velocity.add(this.acceleration)
						this.position.add(this.velocity)
						this.lifespan -= 2
					}
					display() {
						sketch.stroke(252, 88, 0, (this.randColor > 10 ? this.lifespan : 150))
						sketch.strokeWeight(8)
						sketch.fill(252, 151, 0, (this.randColor > 10 ? this.lifespan : 255))
						sketch.ellipse(this.randPosX, this.position.y, this.randWidth, this.randWidth)
					}
					isDead() {
						return this.lifespan <= 0
					}
				}
				
				class ParticleSystem {
					constructor(position) {
						this.origin = position.copy()
						this.particles = []
						this.isGenerating
					}
					addParticle(fireSize) {
						if (this.isGenerating) return false
						if (this.particles.length < 80) {
							this.particles.push(new Particle(this.origin, fireSize))
						} 
						this.isGenerating = true
						setTimeout(() => {
							this.isGenerating = false
						}, 200)
					}
					run(radius) {
						this.origin = radius.copy()
						for (var i = this.particles.length - 1; i >= 0; i--) {
							var p = this.particles[i]
							p.run()
							if (p.isDead()) {
								this.particles.splice(i, 1)
							}
						}
					}
				}
			}
			let canv = (sketch) => {
				sketchInit(sketch)
			}
			this.myp5 = new p5(canv, 'canvas_container')
			if (!this.inGame) {
				this.initDemo()
			}
		}
	},
	mounted() {
		this.initGame()
	}
})
