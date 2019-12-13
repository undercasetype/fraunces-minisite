import "../css/main.css";
import "./assets";
import FontFaceObserver from "fontfaceobserver";

const fontName = "Fraunces";
const fontTimeOut = 5000; // In milliseconds

let scrollPos = 0;

// Generic functions
// From https://gist.github.com/beaucharman/e46b8e4d03ef30480d7f4db5a78498ca#gistcomment-3015837
const throttle = (fn, wait) => {
	let previouslyRun, queuedToRun;

	return function invokeFn(...args) {
		const now = Date.now();

		queuedToRun = clearTimeout(queuedToRun);

		if (!previouslyRun || now - previouslyRun >= wait) {
			fn.apply(null, args);
			previouslyRun = now;
		} else {
			queuedToRun = setTimeout(
				invokeFn.bind(null, ...args),
				wait - (now - previouslyRun)
			);
		}
	};
};

// Set up FontFaceObserver
const font = new FontFaceObserver(fontName);
font.load(null, fontTimeOut).then(
	() => {
		console.log("Font is available");
		document.documentElement.className += " fonts-loaded";
	},
	() => {
		console.log("Font is not available");
	}
);

// Interactive contols (sliders that tweak axes)
const interactives = document.querySelectorAll(".interactive-controls");
for (const interactive of interactives) {
	const area = interactive.querySelector(".interactive-controls-text");
	const sliders = interactive.querySelectorAll(
		".interactive-controls-slider"
	);
	const instances = interactive.querySelector(
		".interactive-controls-instances"
	);

	const varset = (name, value) => {
		area.style.setProperty(`--${name}`, value);
	};

	for (const slider of sliders) {
		// Apply initial axis value to text area
		varset(slider.name, slider.value);
		slider.oninput = e => {
			// Set new axis value to text area
			varset(e.target.name, e.target.value);
			// Unselect named instance dropdown
			// Optionally, see if current axes match instance and select that
			if (instances) {
				instances.selectedIndex = -1;
			}
		};
	}

	if (instances) {
		instances.onchange = e => {
			const axes = JSON.parse(
				e.target.options[e.target.selectedIndex].value
			);
			for (const axis in axes) {
				// Set new axis value on slider
				interactive.querySelector(`[name=${axis}]`).value = axes[axis];
				// Apply new axis value to text area
				varset(axis, axes[axis]);
			}
		};
	}
}

// Make WONK snap
const wonkSliders = document.querySelectorAll(
	".wonk-demo .interactive-controls-slider"
);
for (const wonkSlider of wonkSliders) {
	wonkSlider.onchange = e => {
		e.target.value = Math.round(e.target.value);
	};
}

// Pause animations when element is not in viewport
const obs = new IntersectionObserver(els => {
	els.forEach(el => {
		el.intersectionRatio > 0
			? el.target.classList.add("in-view")
			: el.target.classList.remove("in-view");
	});
});
if ("IntersectionObserver" in window) {
	// eslint-disable-next-line compat/compat
	const elements = document.querySelectorAll(".animates");
	elements.forEach(el => {
		obs.observe(el);
	});
}
/*

// Character grid
const grid = document.querySelector(".character-grid");
const gridzoom = document.querySelector(".character-grid-zoom");
grid.onmousemove = throttle(e => {
	if (e.target.tagName === "LI") {
		gridzoom.innerHTML = e.target.innerHTML;
	}
}, 100);

*/

// Repeat marquee content a few times to avoid gaps
const marquees = document.querySelectorAll(".marquee-marq");
marquees.forEach(el => {
	for (let i = 0; i < 5; i++) {
		el.appendChild(
			el.querySelector(".marquee-marq-content").cloneNode(true)
		);
	}
	el.classList.add("play");
});

// Generic mousemove
const mouse = {
	x: 0,
	y: 0,
	dragCallback: false, // What to do when a dragged element is moved
	endCallback: false // What to do when a dragging stops
};
window.onmousemove = e => {
	if (!mouse.dragCallback) return; // Not currently dragging
	e.preventDefault();
	// TODO: either debouce/throttle here, or in each callback?
	mouse.dragCallback && mouse.dragCallback(e);
};
window.onmouseup = () => {
	mouse.endCallback && mouse.endCallback();
	mouse.dragCallback = mouse.endCallback = false;
};

// Swiper for opsz demo
const swiper = document.querySelector(".opsz-demo-container");
const swiperHandle = document.querySelector(".opsz-slider-handle");
swiperHandle.onmousedown = () => {
	swiperHandle.classList.add("dragging");
	mouse.dragCallback = e => {
		const x = e.clientX - swiper.offsetLeft;
		const perc = (x / (swiper.offsetWidth / 100)).toFixed(2);
		const clampedPerc = Math.max(1, Math.min(perc, 100));
		swiper.style.setProperty("--offset", `${clampedPerc}%`);
	};
	mouse.endCallback = () => {
		swiperHandle.classList.remove("dragging");
	};
};

// Sticker stuff
const stickable = document.querySelector(".sticker-hero");
let maxStickableY;
const sticker = {
	x: 0,
	y: 0,
	el: false,
	updateSticker: function(e) {
		this.x = e.clientX + document.documentElement.scrollLeft;
		this.y = Math.min(
			e.clientY + document.documentElement.scrollTop,
			maxStickableY
		);
		this.el && this.moveSticker();
	},
	moveSticker: function() {
		this.el.style.setProperty("--x", `${this.x}px`);
		this.el.style.setProperty("--y", `${this.y}px`);
	}
};

// Move sticker when dragging
stickable.onmousemove = throttle(e => {
	e.preventDefault();
	sticker.updateSticker(e);
}, 10);

// "Pick up" sticker or create new one
// TODO: do not snap to center, but take offset from center of sticker into account
stickable.onmousedown = e => {
	if (e.which !== 1) return; // Only work on left mouse button
	e.preventDefault();
	const onSticker = e.target.classList.contains("sticker");
	if (onSticker && !sticker.el) {
		// Move clicked sticker
		sticker.el = e.target;
		sticker.el.classList.add("dragging");
		sticker.updateSticker(e);
		// Create "residue"
		const residue = sticker.el.cloneNode(true);
		residue.classList.add("sticker-residue");
		residue.classList.remove("sticker", "dragging");
		stickable.prepend(residue);
		setTimeout(() => {
			residue.remove();
		}, 70000); // Timeout should be longer than CSS fade animation
	} else {
		// Create new sticker
		// TODO: get new sticker from list instead of cloning current sticker
		sticker.el = document
			.querySelector(".sticker.sticker-1")
			.cloneNode(true);
		stickable.prepend(sticker.el);
		sticker.el.classList.add("dragging");
		sticker.updateSticker(e);
	}
};

// Stop dragging sticker
stickable.onmouseup = () => {
	if (sticker.el) {
		sticker.el.classList.remove("dragging");
		sticker.el = false;
	}
};

// Add subtle parallax scrolling to "UV Light Rafters" graphic
let uvStart;
let uvEnd;
let uvPerc;
const uvEl = document.querySelector(".uv-container");
window.onscroll = throttle(() => {
	scrollPos = window.scrollY;

	if (scrollPos > uvStart && scrollPos < uvEnd) {
		const offset = ((scrollPos - uvStart) / uvPerc).toFixed(2);
		uvEl.style.setProperty("--offset", offset);
	}
}, 100);

// Update variables related to the viewport
const setViewportValues = () => {
	// Redetermine area stickers can be moved in
	maxStickableY = stickable.offsetTop + stickable.offsetHeight;

	// Redetermine "UV Light Rafters" image offsets
	uvStart = uvEl.offsetTop - window.innerHeight;
	uvEnd = uvEl.offsetTop + uvEl.offsetHeight;
	uvPerc = uvEnd - uvStart;
};
window.onresize = throttle(setViewportValues, 100);
setViewportValues();
