import { mdsvex } from 'mdsvex';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';
import process from 'process';

const is_dev = (process.env.NODE_ENV === 'development');

let config = {
	extensions: ['.svelte', '.svx'],
	kit: {
		adapter: adapter(),
		target: 'body',
	},

	preprocess: [
		preprocess({}),
		mdsvex({
			extensions: ['.svx'],

			smartypants: {
				dashes: 'oldschool'
			},

			remarkPlugins: [],
			rehypePlugins: []
		})
	],
};

export default config;
