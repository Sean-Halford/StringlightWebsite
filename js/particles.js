/**
 * Stringlight 动态粒子背景脚本
 * 基于 Logo 配色：橙色与蓝色
 */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particlesArray;

// 设置 Canvas 尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 窗口大小改变时重置
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

// 鼠标交互位置
const mouse = {
    x: null,
    y: null,
    radius: 150 // 鼠标影响范围
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

// 鼠标移出窗口清除坐标
window.addEventListener('mouseout', function() {
    mouse.x = undefined;
    mouse.y = undefined;
});

// 粒子类
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }

    // 绘制单个粒子
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    // 更新粒子位置
    update() {
        // 边界检测（碰到屏幕边缘反弹）
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // 鼠标互动（躲避效果）
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < mouse.radius + this.size) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                this.x += 10;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 10;
            }
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                this.y += 10;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 10;
            }
        }

        // 移动粒子
        this.x += this.directionX;
        this.y += this.directionY;

        this.draw();
    }
}

// 初始化粒子群
function init() {
    particlesArray = [];
    // 粒子数量：根据屏幕面积计算，避免过多卡顿
    let numberOfParticles = (canvas.height * canvas.width) / 20000;
    
    // Logo 配色方案
    const colors = [
        'rgba(230, 138, 0, 0.8)',   // Logo 橙色
        'rgba(0, 124, 176, 0.8)',   // Logo 蓝色
        'rgba(44, 44, 99, 0.8)'     // 页面深蓝主题色
    ];

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1; // 粒子大小 1-4
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 2) - 1; // 速度 -1 到 1
        let directionY = (Math.random() * 2) - 1;
        
        // 随机分配颜色
        let color = colors[Math.floor(Math.random() * colors.length)];

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

// 连线效果
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
            + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            
            // 如果两个粒子距离足够近，画线
            if (distance < (canvas.width/7) * (canvas.height/7)) {
                opacityValue = 1 - (distance/20000);
                ctx.strokeStyle = 'rgba(100, 100, 100,' + opacityValue + ')'; // 线条颜色灰色
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

// 启动
init();
animate();