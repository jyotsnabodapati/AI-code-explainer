function initParticleLogo(canvasId, numParticles, interactionEnabled) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;
    
    let particles = [];
    for(let i=0; i<numParticles; i++){
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: Math.random() * 2 + 0.5
        });
    }

    let mouse = { x: -1000, y: -1000 };
    if(interactionEnabled) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for(let i=0; i<particles.length; i++){
            let p = particles[i];
            
            if (interactionEnabled) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < width/2) {
                    p.x += dx * 0.05;
                    p.y += dy * 0.05;
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fillStyle = i % 2 === 0 ? '#00e5ff' : '#ff007f';
            ctx.fill();

            for(let j=i+1; j<particles.length; j++){
                let p2 = particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                let connectDistance = width * 0.35;
                if(dist < connectDistance){
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    let opacity = 1 - (dist/connectDistance);
                    ctx.strokeStyle = `rgba(112, 0, 255, ${opacity})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Canvas Logos
    initParticleLogo('splashLogoCanvas', 60, false); // Big splash logo
    initParticleLogo('headerLogoCanvas', 30, true);  // Interactive header logo

    // Splash screen logic
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('splash-hidden');
        document.querySelector('.app-container').classList.add('loaded');
    }, 1500); // 1.5 seconds delay

    // Configure marked to use highlight.js
    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    const explainBtn = document.getElementById('explainBtn');
    const codeInput = document.getElementById('codeInput');

    // States
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const resultState = document.getElementById('resultState');

    const setState = (state) => {
        emptyState.classList.add('hidden');
        loadingState.classList.add('hidden');
        resultState.classList.add('hidden');

        if (state === 'empty') emptyState.classList.remove('hidden');
        if (state === 'loading') loadingState.classList.remove('hidden');
        if (state === 'result') resultState.classList.remove('hidden');
    };

    explainBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        const analogyTheme = document.getElementById('analogyTheme').value;

        if (!code) {
            alert('Please paste some code first!');
            codeInput.focus();
            return;
        }

        setState('loading');

        try {
            const response = await fetch('/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, theme: analogyTheme })
            });

            const data = await response.json();

            if (response.ok) {
                resultState.innerHTML = marked.parse(data.explanation);
                setState('result');
            } else {
                resultState.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; padding: 1rem; border-radius: 8px;">
                        <strong>Error:</strong> ${data.error || 'Something went wrong.'}
                    </div>`;
                setState('result');
            }
        } catch (error) {
            resultState.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; padding: 1rem; border-radius: 8px;">
                    <strong>Network Error:</strong> Failed to connect to the backend server. Make sure your Flask app is running!
                </div>`;
            setState('result');
        }
    });

    // Handle Cmd/Ctrl + Enter to submit
    codeInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            explainBtn.click();
        }

        // Handle Enter key for smart auto-indentation
        if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            const value = codeInput.value;
            
            // Get the current line up to the cursor
            const textBeforeCursor = value.substring(0, start);
            const lines = textBeforeCursor.split('\n');
            const currentLine = lines[lines.length - 1];
            
            // Find existing indentation
            const indentMatch = currentLine.match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : '';
            
            // If line ends with a colon, add 4 more spaces
            if (currentLine.trimEnd().endsWith(':')) {
                indent += '    ';
            }
            
            // Insert newline and indentation
            codeInput.value = value.substring(0, start) + '\n' + indent + value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 1 + indent.length;
        }

        // Handle Tab key to insert spaces instead of changing focus
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + "    " + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
        }
    });
});
