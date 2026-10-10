import { animate, stagger, inView, hover } from 'framer-motion/dom';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
	// Hero entrance
	animate(
		'[data-hero]',
		{ opacity: [0, 1], y: [20, 0] },
		{ delay: stagger(0.12), duration: 0.7, ease: 'easeOut' }
	);

	// Scroll-triggered reveals
	inView('.grid', (el) => {
		animate(
			el.querySelectorAll('.card'),
			{ opacity: [0, 1], y: [28, 0] },
			{ delay: stagger(0.1), duration: 0.6, ease: 'easeOut' }
		);
	});
	inView('.steps', (el) => {
		animate(
			el.querySelectorAll('.step'),
			{ opacity: [0, 1], x: [-32, 0] },
			{ delay: stagger(0.15), duration: 0.6, ease: 'easeOut' }
		);
	});
	inView('.cta .box', (el) => {
		animate(el, { opacity: [0, 1], scale: [0.96, 1] }, { duration: 0.7 });
	});

	// Spring hover on cards and buttons
	const spring = { type: 'spring', stiffness: 300, damping: 20 };
	hover('.btn', (el) => {
		animate(el, { scale: 1.04 }, spring);
		return () => animate(el, { scale: 1 }, spring);
	});
}
