
import { lightenColor } from './utils/ColorUtils.js';

export class LogoAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.lightenColor = lightenColor;
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 25,
            dx: 2,
            dy: 2,
            color: '#3498db'
        };
        
        this.animate = this.animate.bind(this);
    }
    
    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        
        const gradient = this.ctx.createRadialGradient(
            this.ball.x - this.ball.radius/3, 
            this.ball.y - this.ball.radius/3, 
            0,
            this.ball.x, 
            this.ball.y, 
            this.ball.radius
        );
        
        gradient.addColorStop(0, this.lightenColor(this.ball.color, 50));
        gradient.addColorStop(1, this.ball.color);
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        if (this.ball.x + this.ball.radius > this.width || 
            this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
        }
        if (this.ball.y + this.ball.radius > this.height || 
            this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        
        requestAnimationFrame(this.animate);
    }
    
    start() {
        this.animate();
    }
}