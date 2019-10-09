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
		timeLimit: 15,
		timer: null,
		message: '',
		rainColor: '#098bd6',
		score: 0,
		hScale: window.innerHeight / 800
	},
	watch: {
		timeLimit(val) {
			if (val <= 0) {
				clearInterval(this.timer)
				this.gameOver = true
				this.message = `Your score: ${this.score}`
			}
		}
	},
	methods: {
		restartGame() {
			this.timelineParameters.loop = false
			this.timelineParameters.autoplay = false
			this.timelineParameters.pause()
			this.inGame = true;
			this.gameOver = false;
			this.fires = []
			this.timeLimit = 15
			this.score = 0
			this.initGame()
			this.timer = setInterval(() => {
				this.timeLimit -= 1
			}, 1000)
		},
		startGame() {
			this.restartGame();
		},
		initGame() {
			let _this = this
			let particleSystem = []

			document.addEventListener('touchmove', (event) => {
				event.preventDefault()
				var touch = event.touches[0]
				this.position.x = touch.clientX
				if (touch.clientY < window.innerHeight - 200) {
					this.position.y = touch.clientY
				}
			})
			document.addEventListener('mousemove', (event) => {
				this.position.x = event.clientX
				if (event.clientY < window.innerHeight - 200) {
					this.position.y = event.clientY
				}
			})

			function sketchInit(sketch) {
				let engine
				let world
				let rain = []
				let inter = null
				const RAIN_COUNT = 110
				const MAX_FIRES = window.innerWidth / 60
				const RAIN_SIZE = 8
				const Engine = Matter.Engine
				const Render = Matter.Render
				const World = Matter.World
				const Bodies = Matter.Bodies
				const Events = Matter.Events


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
						let lifespan = sketch.random(5, 30)
						let x = sketch.random(lifespan, window.innerWidth - lifespan)
						particleSystem.push(new ParticleSystem(sketch.createVector(x, window.innerHeight - lifespan)))
						_this.fires.push(new Fire(x, lifespan))
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
							particleSystem[x].run()
						}
						if (_this.fires[x] && !_this.fires[x].isAlive) {
							_this.fires[x].removeFromWorld()
							_this.fires.splice(x, 1)
							particleSystem.splice(x, 1)
							x--
						}
					}
					if (_this.fires.length < MAX_FIRES) {
						let lifespan = sketch.random(5, 30)
						var x
						do {
							x = sketch.random(lifespan, window.innerWidth - lifespan)
						} while ((x - lifespan - 30) < _this.position.x && (x + lifespan + 30) > _this.position.x)
						_this.fires.push(new Fire(x, lifespan))
						particleSystem.push(new ParticleSystem(sketch.createVector(x, window.innerHeight - lifespan)))
					}
					if (!_this.gameOver) {}
				}
				sketch.mouseDragged = function () {
					if (inter) return false
					inter = setInterval(() => {
						generateRain()
					}, 10)
				}
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
				function generateRain() {
					var isGenerating
					if (isGenerating) return false
					rain.push(new Raindrop(_this.position.x, _this.position.y))
					isGenerating = true
					setTimeout(() => {
						isGenerating = false
					}, 10)
				}
				class Raindrop {
					constructor(x, y) {
						this.body = Bodies.circle(sketch.random(x - 50, x + 50), sketch.random(y - 20, y + 20), sketch.random(2, RAIN_SIZE), {
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
						if (this.body.circleRadius > (dropSize) * .1) {
							this.body.circleRadius -= (dropSize) * .1
							this.body.position.y = window.innerHeight - this.body.circleRadius
						} else {
							this.isAlive = false
						}
					}
					removeFromWorld() {
						World.remove(world, this.body)
					}
				}
				class Particle {
					constructor(position, fireSize) {
						this.acceleration = sketch.createVector(0, -0.005)
						this.velocity = sketch.createVector(sketch.random(-1, 1), sketch.random(-1, 0))
						this.position = position.copy()
						this.lifespan = 155
						this.randColor = sketch.random(0, 100)
						this.randWidth = sketch.random(2, 12)
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
						return this.lifespan < 0
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
						if (this.particles.length < 180) {
							this.particles.push(new Particle(this.origin, fireSize))
						} 
						this.isGenerating = true
						setTimeout(() => {
							this.isGenerating = false
						}, 100)
					}
					run() {
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
		}
	},
	mounted() {
		this.initGame()
	}
})
