import "./assets";
import { fontName } from "./font";
import FontFaceObserver from "fontfaceobserver";

const fontTimeOut = 5000; // In milliseconds
const numberOfStickers = 7; // How many hero-stickers-0x.svg do we have?
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
const wonkSliders = document.querySelectorAll(".wonk-slider");

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
	endCallback: false, // What to do when a dragging stops
	executeCallback: function(e) {
		if (mouse.dragCallback) {
			if (e.cancelable) {
				e.preventDefault();
			}
			mouse.dragCallback(e);
		}
	}
};
window.addEventListener("mousemove", e => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	mouse.executeCallback(e);
});
window.addEventListener("touchstart", e => {
	mouse.x = e.changedTouches[0].clientX;
	mouse.y = e.changedTouches[0].clientY;
	mouse.executeCallback(e);
});
window.addEventListener("mouseup", () => {
	mouse.endCallback && mouse.endCallback();
	mouse.dragCallback = mouse.endCallback = false;
});

// Swiper for opsz demo
const swiper = document.querySelector(".opsz-demo");
const swiperHandle = document.querySelector(".opsz-slider-handle");
const calculateSwiperOffset = () => {
	const x = mouse.x - swiper.offsetLeft;
	const perc = (x / (swiper.offsetWidth / 100)).toFixed(2);
	const clampedPerc = Math.max(1, Math.min(perc, 100));
	swiper.style.setProperty("--offset", `${clampedPerc}%`);
};
swiperHandle.onmousedown = () => {
	swiperHandle.classList.add("dragging");
	mouse.dragCallback = () => calculateSwiperOffset();
	mouse.endCallback = () => {
		swiperHandle.classList.remove("dragging");
	};
};
swiperHandle.addEventListener("touchmove", e => {
	swiperHandle.classList.add("dragging");
	mouse.x = e.touches[0].clientX;
	mouse.y = e.touches[0].clientY;
	calculateSwiperOffset();

	mouse.endCallback = () => {
		swiperHandle.classList.remove("dragging");
	};
});

// Sticker stuff
const stickable = document.querySelector(".sticker-hero");
const headerEl = document.querySelector("header");
const sticker = {
	x: 0,
	y: 0,
	offsetX: 0,
	offsetY: headerEl.clientHeight,
	current: false,
	updateSticker: function() {
		this.x = mouse.x - sticker.offsetX;
		this.y = mouse.y + document.documentElement.scrollTop - sticker.offsetY;
		this.current && this.moveSticker();
	},
	moveSticker: function() {
		this.current.style.setProperty("--x", `${this.x}px`);
		this.current.style.setProperty("--y", `${this.y}px`);
	},
	generateSticker: function(x, y) {
		const tilt = Math.floor(Math.random() * 40 + 1) - 20;
		const stickerNumber = Math.floor(Math.random() * numberOfStickers + 1);
		const newSticker = document.createElement("div");
		newSticker.classList.add("sticker", `sticker-${stickerNumber}`);
		newSticker.style.setProperty("--tilt", `${tilt}deg`);
		if (x && y) {
			newSticker.style.setProperty("--x", `${x}px`);
			newSticker.style.setProperty("--y", `${y}px`);
		}
		sticker.current = newSticker;
		stickable.appendChild(sticker.current);
	},
	destroySticker: function() {
		stickable.removeChild(sticker.current);
		sticker.current = false;
	}
};

stickable.addEventListener("touchend", e => {
	// Prevent mouse behaviour on touch devices.
	if (e.cancelable) {
		e.preventDefault();
	}

	if (mouse.y === e.changedTouches[0].clientY) {
		sticker.generateSticker();
		sticker.updateSticker();
	}
});

stickable.addEventListener("mousemove", () => {
	if (!sticker.current && mouse.x && mouse.y) {
		sticker.generateSticker();
	}
	sticker.updateSticker();
});

// Place sticker and create new one
stickable.addEventListener("mousedown", e => {
	if (e.which !== 1) return; // Only work on left mouse button
	sticker.generateSticker();
	sticker.updateSticker();
});

// Don't stick the sticker when leaving the sticker area.
stickable.addEventListener("mouseleave", () => {
	sticker.destroySticker();
});

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

// Checkerboard logic
const piecesTurns = [];
const pieces = {
	1: "a",
	3: "c",
	5: "e",
	7: "g",

	10: "i",
	12: "l",
	14: "n",
	16: "o",

	17: "r",
	19: "s",
	21: "t",
	23: "u",

	26: "w",
	28: "y",
	30: "z",
	32: "€", ////////// Joker

	34: "A",
	36: "C",
	38: "E",
	40: "G",

	41: "I",
	43: "L",
	45: "N",
	47: "O",

	50: "R",
	52: "S",
	54: "T",
	56: "U",

	57: "W",
	59: "Y",
	61: "Z",
	63: "Æ" ////////// Joker
};

const originalPieceVariants = {
	A: [
		"À",
		"Á",
		"Â",
		"Ã",
		"Ä",
		"Ā",
		"Ă",
		"Ǻ",
		"Ạ",
		"Ȁ",
		"Ȃ",
		"Ắ",
		"Ặ",
		"Ằ",
		"Ẳ",
		"Ẵ",
		"Ấ",
		"Ậ",
		"Ầ",
		"Ẩ",
		"Ẫ",
		"Ả"
	],
	a: [
		"à",
		"á",
		"â",
		"ã",
		"ä",
		"ā",
		"ă",
		"ǻ",
		"ạ",
		"ȁ",
		"ȃ",
		"ắ",
		"ặ",
		"ằ",
		"ẳ",
		"ẵ",
		"ấ",
		"ậ",
		"ầ",
		"ẩ",
		"ẫ",
		"ả"
	],
	// 'Æ': [ 'Ǽ' ],
	// 'æ': [ 'ǽ' ],
	C: ["Ć", "Ĉ", "Č", "Ċ", "Ç"],
	c: ["ć", "ĉ", "č", "ċ", "ç"],
	// D: ["Ď"],
	// d: ["ď"],
	E: [
		"È",
		"É",
		"Ê",
		"Ẽ",
		"Ě",
		"Ë",
		"Ē",
		"Ĕ",
		"Ė",
		"Ẹ",
		"Ę",
		"Ȅ",
		"Ȇ",
		"Ế",
		"Ệ",
		"Ề",
		"Ể",
		"Ễ",
		"Ẻ"
	],
	e: [
		"è",
		"é",
		"ê",
		"ẽ",
		"ě",
		"ë",
		"ē",
		"ĕ",
		"ė",
		"ẹ",
		"ę",
		"ȅ",
		"ȇ",
		"ế",
		"ệ",
		"ề",
		"ể",
		"ễ",
		"ẻ"
	],
	G: ["Ĝ", "Ǧ", "Ğ", "Ġ", "Ģ"],
	g: ["ĝ", "ǧ", "ğ", "ġ", "ģ"],
	// H: ["Ĥ"],
	// h: ["ĥ"],
	I: ["Ì", "Í", "Î", "Ĩ", "Ï", "Ī", "Ĭ", "İ", "Ị", "Ȉ", "Ȋ", "Ỉ"],
	i: ["ì", "í", "î", "ĩ", "ï", "ī", "ĭ", "ị", "ȉ", "ȋ", "ỉ"],
	// J: ["Ĵ"],
	// j: ["ĵ"],
	// K: ["Ķ"],
	// k: ["ķ"],
	L: ["Ĺ", "Ľ", "Ļ", "Ŀ"],
	l: ["ĺ", "ľ", "ļ", "ŀ"],
	N: ["Ń", "Ñ", "Ň", "Ņ"],
	n: ["ń", "ñ", "ň", "ņ", "ŉ"],
	O: [
		"Ò",
		"Ó",
		"Ô",
		"Õ",
		"Ö",
		"Ō",
		"Ŏ",
		"Ő",
		"Ọ",
		"Ǫ",
		"Ȍ",
		"Ȏ",
		"Ȫ",
		"Ȭ",
		"Ȱ",
		"Ố",
		"Ộ",
		"Ồ",
		"Ổ",
		"Ỗ",
		"Ỏ",
		"Ớ",
		"Ợ",
		"Ờ",
		"Ở",
		"Ỡ",
		"Ø"
	],
	o: [
		"ò",
		"ó",
		"ô",
		"õ",
		"ö",
		"ō",
		"ŏ",
		"ő",
		"ọ",
		"ǫ",
		"ȍ",
		"ȏ",
		"ȫ",
		"ȭ",
		"ȱ",
		"ố",
		"ộ",
		"ồ",
		"ổ",
		"ỗ",
		"ỏ",
		"ớ",
		"ợ",
		"ờ",
		"ở",
		"ỡ",
		"ǿ"
	],
	R: ["Ŕ", "Ř", "Ŗ", "Ȑ", "Ȓ"],
	r: ["ŕ", "ř", "ŗ", "ȑ", "ȓ"],
	S: ["Ś", "Ŝ", "Š", "Ş", "Ș"],
	s: ["ś", "ŝ", "š", "ş", "ș"],
	T: ["Ť", "Ţ", "Ț"],
	t: ["ť", "ţ", "ț"],
	U: [
		"Ù",
		"Ú",
		"Û",
		"Ũ",
		"Ü",
		"Ū",
		"Ŭ",
		"Ů",
		"Ű",
		"Ụ",
		"Ų",
		"Ȕ",
		"Ȗ",
		"Ứ",
		"Ự",
		"Ừ",
		"Ử",
		"Ữ"
	],
	u: [
		"ù",
		"ú",
		"û",
		"ũ",
		"ü",
		"ū",
		"ŭ",
		"ů",
		"ű",
		"ụ",
		"ų",
		"ȕ",
		"ȗ",
		"ứ",
		"ự",
		"ừ",
		"ử",
		"ữ"
	],
	W: ["Ẁ", "Ẃ", "Ŵ", "Ẅ"],
	w: ["ẁ", "ẃ", "ŵ", "ẅ"],
	Y: ["Ỳ", "Ý", "Ŷ", "Ỹ", "Ÿ", "Ȳ", "Ỵ", "Ỷ"],
	y: ["ỳ", "ý", "ŷ", "ỹ", "ÿ", "ȳ", "ỵ", "ỷ"],
	Z: ["Ź", "Ž", "Ż"],
	z: ["ź", "ž", "ż"],

	"€": [
		"€",
		"¤",
		"$",
		"¢",
		"ƒ",
		"£",
		"¥",
		"₣",
		"₤",
		"₦",
		"₧",
		"₩",
		"₫",
		"₭",
		"₱",
		"₲",
		"₵",
		"₹",
		"₺",
		"₼",
		"₽"
	],
	Æ: [
		"Æ",
		"æ",
		"Đ",
		"đ",
		"Ð",
		"ð",
		"Ħ",
		"ħ",
		"ı",
		"ȷ",
		"Ł",
		"ł",
		"Ŋ",
		"ŋ",
		"Ø",
		"ø",
		"Œ",
		"œ",
		"ẞ",
		"ß",
		"ĸ",
		"Ŧ",
		"ŧ",
		"Þ",
		"þ",
		"Ə",
		"ə"
	]
};
let pieceVariants = JSON.parse(JSON.stringify(originalPieceVariants));

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
			options.push([-1, -1]);
		}
		move = pos + 8 - 1;
		if (y < 8 && !pieces[move]) {
			options.push([-1, 1]);
		}
	}

	// To the right
	if (x !== 0) {
		move = pos - 8 + 1;
		if (y > 1 && !pieces[move]) {
			options.push([1, -1]);
		}
		move = pos + 8 + 1;
		if (y < 8 && !pieces[move]) {
			options.push([1, 1]);
		}
	}

	let option = false;
	option = popRandomValue(options);

	return { oldPos: pos, move: option };
}

// Return random value from array and delete it
function popRandomValue(list) {
	return list
		.sort(function() {
			return 0.5 - Math.random();
		})
		.pop();
}

// Fill entire checkeboard
function setupCheckerBoard() {
	const checkerboard = document.querySelector(".checkersboard");
	for (const piece in pieces) {
		const newPiece = popRandomValue(pieceVariants[pieces[piece]]);
		const cell = checkerboard.querySelector(`.check${piece} .piece`);
		cell.innerHTML =
			pieces[piece] === null ? "" : `<span>${newPiece}</span>`;
	}
}

// Move piece to new cell and change its character
function movePiece() {
	if (!piecesTurns.length) {
		for (const piece in pieces) {
			if (pieces[piece] !== null) {
				piecesTurns.push(pieces[piece]);
			}
		}
	}

	const piece = popRandomValue(piecesTurns);
	const { oldPos, move } = getPiecePosition(piece);
	if (move) {
		const newPos = oldPos + move[0] + move[1] * 8;
		const oldCell = document.querySelector(`.check${oldPos} .piece`);
		const newCell = document.querySelector(`.check${newPos} .piece`);

		oldCell.classList.add("moving");
		oldCell.style.setProperty(
			"transform",
			`translate(
				calc((${move[0]} * 100%) + (${move[0]} * var(--gap))),
				calc((${move[1]} * 100%) + (${move[1]} * var(--gap)))
			)`
		);
		oldCell.style.setProperty("opacity", 0);

		// Get new variant
		if (!pieceVariants[piece].length) {
			pieceVariants[piece] = [...originalPieceVariants[piece]];
		}
		const newPiece = popRandomValue(pieceVariants[piece]);

		setTimeout(() => {
			oldCell.style.setProperty("transform", "");
			oldCell.style.setProperty("opacity", "");
			oldCell.innerHTML = "";
			oldCell.classList.remove("moving");
		}, 1000);

		setTimeout(() => {
			newCell.style.setProperty("transform", "");
			newCell.innerHTML = `<span class="new">${newPiece}</span>`;
		}, 500);

		pieces[oldPos] = null;
		pieces[newPos] = piece;
	} else {
		movePiece();
	}
}

// Start checkerboard animation
setupCheckerBoard();
setTimeout(() => {
	setInterval(() => {
		movePiece();
	}, 2000);
}, 2000);

// Stick four random stickers on the screen
const margin = 200;
function clamp(number, min, max) {
	return Math.max(min, Math.min(number, max));
}
function fitSrceen(number) {
	return clamp(Math.floor(Math.random() * number), margin, number - margin);
}
for (let i = 0; i < 4; i++) {
	let randomX = fitSrceen(window.innerWidth);
	let randomY = fitSrceen(window.innerHeight);
	sticker.generateSticker(randomX, randomY);
}
sticker.current = false;
