import { animate, stagger, inView, hover } from 'framer-motion/dom';

const cards = document.querySelectorAll('.card');

// Staggered entrance
animate(
	cards,
	{ opacity: [0, 1], y: [24, 0] },
	{ delay: stagger(0.1), duration: 0.6, ease: 'easeOut' }
);

// Spring hover
hover(cards, (el) => {
	animate(el, { scale: 1.05 }, { type: 'spring', stiffness: 300, damping: 18 });
	return () => animate(el, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 18 });
});

// Scroll-triggered reveal
inView('.reveal', (el) => {
	animate(el, { opacity: [0, 1], x: [-40, 0] }, { duration: 0.7 });
});

// Click-to-replay
document.getElementById('replay').addEventListener('click', () => {
	animate(
		cards,
		{ rotate: [0, 360] },
		{ delay: stagger(0.08), duration: 0.8, ease: 'easeInOut' }
	);
});
