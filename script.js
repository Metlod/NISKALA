const HF_TOKEN = "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"; 
const POLLINATIONS_KEY = "sk_stigyXof1jdlyOq6tHGfortJusSeOLiK";
const ENDPOINT = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

document.addEventListener('DOMContentLoaded', () => {

    const generateBtn = document.getElementById('generateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const promptInput = document.getElementById('promptInput');
    const outputImage = document.getElementById('outputImage');
    const loader = document.getElementById('loader');
    const placeholderText = document.getElementById('placeholderText');
    const engineStatus = document.getElementById('engineStatus');
    const refDesc = document.getElementById('refDesc');
    const refContainer = document.getElementById('refDescriptionContainer');
    const historyGrid = document.getElementById('historyGrid');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    let selectedStyle = "professional photography, shot on 35mm lens, f/1.8, high resolution portrait";
    let width = 1024;
    let height = 1024;
    let referenceMode = false;

    loadHistory();

    document.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedStyle = card.getAttribute('data-style');
        });
    });

    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            width = parseInt(btn.getAttribute('data-w'));
            height = parseInt(btn.getAttribute('data-h'));
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active-ratio'));
            btn.classList.add('active-ratio');
        });
    });

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            referenceMode = true;
            refContainer.classList.remove('hidden');
            uploadBtn.innerHTML = `<i class="fa-solid fa-check text-green-400"></i> Pose Captured`;
            uploadBtn.classList.add('border-green-400/30');
        }
    });

    resetBtn.addEventListener('click', () => {
        promptInput.value = "";
        refDesc.value = "";
        referenceMode = false;
        refContainer.classList.add('hidden');
        outputImage.classList.add('hidden');
        outputImage.src = "";
        placeholderText.classList.remove('hidden');
        uploadBtn.innerHTML = `<i class="fa-solid fa-image text-gray-400"></i> Upload Pose Reference`;
        uploadBtn.classList.remove('border-green-400/30');
    });

    clearHistoryBtn.addEventListener('click', () => {
        if(confirm('Delete all generated images from history?')) {
            localStorage.removeItem('niskalaHistory');
            loadHistory();
        }
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (!outputImage.src) return;
        const link = document.createElement('a');
        link.href = outputImage.src;
        link.download = `Niskala_AI_Studio.png`;
        link.click();
    });

    function blobToBase64(blob) {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    function saveToHistory(imgSrc, promptText) {
        let history = JSON.parse(localStorage.getItem('niskalaHistory')) || [];
        
        const newItem = {
            id: Date.now(),
            src: imgSrc,
            prompt: promptText,
            timestamp: new Date().toLocaleTimeString()
        };

        history.unshift(newItem);

        if (history.length > 6) {
            history.pop();
        }

        try {
            localStorage.setItem('niskalaHistory', JSON.stringify(history));
            renderHistoryItem(newItem, true);
        } catch (e) {
            console.error("Storage full");
 
            history.pop();
            history.pop();
            try {
                localStorage.setItem('niskalaHistory', JSON.stringify(history));
                loadHistory();
            } catch (err) {
                alert("History storage is full. Please clear history.");
            }
        }
    }

    function loadHistory() {
        historyGrid.innerHTML = "";
        const history = JSON.parse(localStorage.getItem('niskalaHistory')) || [];
        
        if (history.length === 0) {
            historyGrid.innerHTML = `<p class="col-span-full text-center text-gray-600 text-[10px] py-8 uppercase tracking-widest border border-dashed border-white/5 rounded-xl">No generation history</p>`;
            return;
        }

        history.forEach(item => renderHistoryItem(item, false));
    }

    function renderHistoryItem(item, prepend) {
        if(historyGrid.innerHTML.includes("No generation history")) historyGrid.innerHTML = "";

        const div = document.createElement('div');
        div.className = "bg-[#141824] p-2 rounded-xl border border-white/5 group relative hover:border-[#8b5cf6]/50 transition duration-300";
        
        div.innerHTML = `
            <div class="aspect-square rounded-lg overflow-hidden bg-[#0f121d] relative">
                <img src="${item.src}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-300">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <button class="view-btn text-[9px] font-bold uppercase tracking-widest text-white hover:text-[#8b5cf6] transition">
                        <i class="fa-solid fa-eye mb-1 block text-lg"></i> View
                    </button>
                </div>
            </div>
            <div class="mt-2 flex justify-between items-center px-1">
                <p class="text-[9px] text-gray-500 truncate max-w-[80px]" title="${item.prompt}">${item.prompt}</p>
                <span class="text-[8px] text-gray-700 font-mono">${item.timestamp}</span>
            </div>
        `;

        div.querySelector('.view-btn').addEventListener('click', () => {
            outputImage.src = item.src;
            outputImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');

            document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
        });

        if (prepend) {
            historyGrid.prepend(div);
        } else {
            historyGrid.appendChild(div);
        }
    }

    async function generateImage() {
        const userPrompt = promptInput.value.trim();
        if (!userPrompt) return alert("Please enter a prompt.");
        
        generateBtn.disabled = true;
        generateBtn.innerText = "RENDERING...";
        loader.classList.remove('hidden');
        outputImage.classList.add('hidden');
        placeholderText.classList.add('hidden');
        
        engineStatus.innerText = "Flux.1 Router";
        engineStatus.classList.remove('text-orange-400');
        engineStatus.classList.add('text-[#8b5cf6]');

        const anatomyProse = " The subject has anatomically correct hands with five distinct fingers, natural human proportions, and detailed features. High quality, 8k.";
        
        let finalPrompt = "";
        if (referenceMode && refDesc.value.trim()) {
            finalPrompt = `An image following this pose: ${refDesc.value.trim()}. The subject is ${userPrompt}. Style: ${selectedStyle}. ${anatomyProse}`;
        } else {
            finalPrompt = `${userPrompt}, ${selectedStyle}. ${anatomyProse}`;
        }

        try {
            const response = await fetch(ENDPOINT, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    inputs: finalPrompt,
                    parameters: { 
                        width: width, 
                        height: height,
                        num_inference_steps: 4 
                    }
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const blob = await response.blob();

            const base64Data = await blobToBase64(blob);
            
            outputImage.src = base64Data;
            saveToHistory(base64Data, userPrompt);
            finalizeLoading();

        } catch (error) {
            console.log("Switching to Pollinations VIP...", error);
            engineStatus.innerText = "Pollinations VIP";
            engineStatus.classList.remove('text-[#8b5cf6]');
            engineStatus.classList.add('text-orange-400');
            
            const seed = Math.floor(Math.random() * 999999);
            const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&key=${POLLINATIONS_KEY}`;
            
            outputImage.src = pollUrl;

            outputImage.onload = () => {
                saveToHistory(pollUrl, userPrompt);
                finalizeLoading();
            };
        }

        function finalizeLoading() {
            outputImage.classList.remove('hidden');
            loader.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerText = "GENERATE IMAGE";
        }
    }

    generateBtn.addEventListener('click', generateImage);
});