import "./assets";
import { fontName } from "./font";
import FontFaceObserver from "fontfaceobserver";

const fontTimeOut = 5000; // In milliseconds

let scrollPos = 0;

// Generic throttle
const throttle = (fn, wait) => {
	let last, queue;

	return function runFn(...args) {
		const now = Date.now();
		queue = clearTimeout(queue);

		if (!last || now - last >= wait) {
			fn.apply(null, args);
			last = now;
		} else {
			queue = setTimeout(runFn.bind(null, ...args), wait - (now - last));
		}
	};
};

// Set up FontFaceObserver
const font = new FontFaceObserver(fontName);
font.load(null, fontTimeOut).then(
	() => {
		// Font has loaded
		document.documentElement.classList.add("fonts-loaded");
		// Start the marquee with a slight delay to make sure
		// all instaces have been generated and elements are at
		// their final width
		setTimeout(() => {
			startMaqueeMarq();
		}, 100);
	},
	() => {
		// Font didn't load
		document.documentElement.classList.add("fonts-failed");
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
		e.target.dispatchEvent(new Event("input", { bubbles: true }));
	};
}

// Watch if .am-i-in-view elements are visible on screen
// and apply a class accordingly
if ("IntersectionObserver" in window) {
	// eslint-disable-next-line compat/compat
	const obs = new IntersectionObserver(els => {
		els.forEach(el => {
			el.intersectionRatio > 0
				? el.target.classList.add("in-view")
				: el.target.classList.remove("in-view");
		});
	});

	const elements = document.querySelectorAll(".am-i-in-view");
	elements.forEach(el => {
		obs.observe(el);
	});
}

// Repeat marquee content a few times to avoid gaps
function startMaqueeMarq() {
	const marquees = document.querySelectorAll(".marquee-marq");
	marquees.forEach(el => {
		const content = el.querySelector(".marquee-marq-content");
		el.appendChild(content.cloneNode(true));
		el.classList.remove("paused");
	});
}

// Generic mousemove
const mouse = {
	x: 0,
	y: 0,
	dragCallback: false, // What to do when a dragged element is moved
	endCallback: false // What to do when a dragging stops
};
window.onmousemove = e => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	if (mouse.dragCallback) {
		e.preventDefault();
		mouse.dragCallback(e);
	}
};
window.onmouseup = () => {
	mouse.endCallback && mouse.endCallback();
	mouse.dragCallback = mouse.endCallback = false;
};

// Swiper for opsz demo
const swiper = document.querySelector(".opsz-demo");
const swiperHandle = document.querySelector(".opsz-slider-handle");
swiperHandle.onmousedown = () => {
	swiperHandle.classList.add("dragging");
	mouse.dragCallback = () => {
		const x = mouse.x - swiper.offsetLeft;
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
	current: false,
	updateSticker: function() {
		this.x = mouse.x + document.documentElement.scrollLeft;
		this.y = Math.min(
			mouse.y + document.documentElement.scrollTop,
			maxStickableY
		);
		this.current && this.moveSticker();
	},
	moveSticker: function() {
		this.current.style.setProperty("--x", `${this.x}px`);
		this.current.style.setProperty("--y", `${this.y}px`);
	}
};

// "Pick up" sticker or create new one
// TODO: do not snap to center, but take offset from center of sticker into account
stickable.onmousedown = e => {
	if (e.which !== 1) return; // Only work on left mouse button
	const onSticker = e.target.classList.contains("sticker");
	if (onSticker && !sticker.current) {
		// Move clicked sticker
		sticker.current = e.target;
		// Create "residue"
		const residue = sticker.current.cloneNode(true);
		residue.classList.add("sticker-residue");
		residue.classList.remove("sticker", "dragging");
		stickable.prepend(residue);
		setTimeout(() => {
			residue.remove();
		}, 70000); // Timeout should be longer than CSS fade animation
	} else {
		// Create new sticker
		// TODO: get new sticker from list instead of cloning current sticker
		sticker.current = document
			.querySelector(".sticker.sticker-1")
			.cloneNode(true);
		stickable.prepend(sticker.current);
	}
	sticker.updateSticker(e);
	sticker.current.classList.add("dragging");

	mouse.dragCallback = e => {
		sticker.updateSticker(e);
	};
	mouse.endCallback = () => {
		swiperHandle.classList.remove("dragging");
		sticker.current = false;
	};
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

	// Determine opsz container width
	const opszWidth =
		document.querySelector(".opsz-text .prose-content").offsetWidth - 32;
	document
		.querySelector(".opsz-demo")
		.style.setProperty("--width", `${opszWidth}px`);
};
window.onresize = throttle(setViewportValues, 100);
setViewportValues();

// Flip clock for instances
const flip = document.querySelector(".flip");
const flipText = document.querySelector(".flip-text");
flip.onclick = e => {
	const button = e.target;
	if (button.value) {
		const parent = button.closest("ul");
		parent.querySelector(".active").classList.remove("active");
		const [index, axis, value] = button.value.split(" ");
		if (axis === "style") {
			flipText.classList.remove("roman", "italic");
			flipText.classList.add(value);
		} else {
			flipText.style.setProperty(`--${axis}`, value);
		}
		parent.style.setProperty("--offset", 6 - index);
		button.classList.add("active");
	}
};

/* *************************************************** */
/* *************************************************** */
/* *************************************************** */
/* *************************************************** */

const pieces = {
	1: "a",
	2: "b",
	3: "c",
	4: "d",
	5: "e",
	6: "f",
	7: "g",
	8: "h",
	9: "A",
	10: "B",
	11: "C",
	12: "D",
	13: "E",
	14: "F",
	15: "G",
	16: "H"
};

const piecesTurns = [];

function getPiecePosition(piece) {
	// Get current position of stone
	const pos = parseInt(
		Object.keys(pieces).find(key => pieces[key] === piece),
		10
	);

	const x = pos % 8;
	const y = Math.floor((pos - 1) / 8 + 1);

	// Make a list of possible moves
	const options = [];

	// To the left
	let move;
	if (x !== 1) {
		move = pos - 8 - 1;
		if (y > 1 && !pieces[move]) {
			options.push(move);
		}
		move = pos + 8 - 1;
		if (y < 8 && !pieces[move]) {
			options.push(move);
		}
	}
	// To the right
	if (x !== 0) {
		move = pos - 8 + 1;
		if (y > 1 && !pieces[move]) {
			options.push(move);
		}
		move = pos + 8 + 1;
		if (y < 8 && !pieces[move]) {
			options.push(move);
		}
	}

	// console.log(JSON.parse(JSON.stringify(options)));

	let option = false;
	option = popRandomValue(options);

	return { oldPos: pos, newPos: option };
}

function popRandomValue(list) {
	return list
		.sort(function() {
			return 0.5 - Math.random();
		})
		.pop();
}

function drawPieces() {
	const checkerboard = document.querySelector(".checkersboard");
	for (const piece in pieces) {
		const cell = checkerboard.querySelector(`.check${piece} span`);
		cell.innerText = pieces[piece] === null ? "" : pieces[piece];
	}
}

function movePiece() {
	if (!piecesTurns.length) {
		for (const piece in pieces) {
			if (pieces[piece] !== null) {
				piecesTurns.push(pieces[piece]);
			}
		}
	}

	const piece = popRandomValue(piecesTurns);

	const { oldPos, newPos } = getPiecePosition(piece);
	if (newPos) {
		pieces[oldPos] = null;
		pieces[newPos] = piece;
	} else {
		movePiece();
	}
}
drawPieces();

setInterval(() => {
	movePiece();
	drawPieces();
}, 1000);

// movePiece();
// drawPieces();
// document.querySelector("body").onclick = () => {
// 	movePiece();
// 	drawPieces();
// };
