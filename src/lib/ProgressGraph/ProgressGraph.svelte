<!-- this is where the page lives -->

<script>
	import * as Pancake from "@sveltejs/pancake";
	import strftime from "./strftime.js";
	export let source;

	let data = source.history;

	let total_bytes = parseInt(data[0][2]);
	let first_commit_date = Date.parse(data[0][0]);
	let last_commit_date = Date.parse(data[data.length-1][0]);


	let max_bytes = (
		parseInt(data.reduce(
			(p, c) => p[1] > c[1]? p : c
		)[1]) + 4000
	);

	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	]

	const dec2month = (date) => {
		const year = ~~date; // floor(date)
		const month = Math.floor((date % 1) * 12);

		return `${months[month]} ${year}`
	}

	const dec2date = (date) => {
		const year = ~~date; // floor(date)
		const month = Math.floor((date % 1) * 12);

		return `'${(year+'').substring(2)}/${(month+'').padStart(2,'0')}`
	}

	const pc = (date) => {
		return 100 * (date - first_commit_date) / (last_commit_date - first_commit_date);
	};

	/*const format_suffix = (value) => {
		value = value + "";
		return value.replace(
			/(000|000000)$/,
			(zeros) => {
				switch(zeros) {
					case "000":
						return "k";
					case "000000":
						return "M";
					default:
						return zeros;
				}
			}
		);
	}*/

	const calc_percentage = (val, max) => {
		return parseInt(val)/parseInt(max)*100;
	}

	const format_integers = (val, sep) => {
		// from @componitable/format-number
		// Copyright (c) 2017 Forbes Lindesay, BSD 3-clause
		val += '';
		if (!val) return val;
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(val)) {
			val = val.replace(rgx, '$1' + sep + '$2');
		}
		return val;
	};

    function saveCSV(){
        // make preamble
        let content = "iso_date,bytes_disassembled,total_bytes,documented_symbols,partialdoc_symbols,undoc_symbols,commit\n";
        // write CSV
        for (let point of data) {
            content += `${point[0]},${point[1]},${point[2]},${point[3]},${point[4]},${point[5]},${point[6]}\n`
        }
        // export CSV
        let csv = new Blob([content], {type: 'text/csv'});

        const url = URL.createObjectURL(csv);
        const link = document.createElement("a");
        link.href = url;
        link.download = "skxs_disasm.csv";
        document.body.appendChild(link);
        link.dispatchEvent(
            new MouseEvent("click", {bubbles: true, cancelable: true, view: window})
        );
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>

<div id="chart">
	<Pancake.Chart x1={first_commit_date} x2={last_commit_date} y1=0 y2={max_bytes}>
		<Pancake.Grid horizontal count={5} let:value let:first let:last>
			<div class="grid-line horizontal" class:first><span>{calc_percentage(value, total_bytes).toFixed(1)}{last ? ' %' : ''}</span></div>
		</Pancake.Grid>

		<Pancake.Grid vertical count={10} let:value let:last>
			<div class="grid-line vertical"></div>
			<span class="year-label">{strftime("%b. %d", new Date(value))}</span>
		</Pancake.Grid>

		<Pancake.Svg>
			<Pancake.SvgLine data={data} x="{d => Date.parse(d[0])}" y="{d => d[1]}" let:d>
				<path class="data" pathLength=.04 {d}/>
			</Pancake.SvgLine>

			<Pancake.Quadtree data={data} x="{d => Date.parse(d[0])}" y="{d => d[1]}" let:closest>
				{#if closest}
					<Pancake.SvgPoint x={Date.parse(closest[0])} y={closest[1]} let:d>
						<path class="highlight" d={d}/>
					</Pancake.SvgPoint>
				{/if}
			</Pancake.Quadtree>
		</Pancake.Svg>

		<Pancake.Quadtree data={data} x="{d => Date.parse(d[0])}" y="{d => d[1]}" let:closest>
			{#if closest}
				<Pancake.Point x={Date.parse(closest[0])} y={closest[1]} let:d>
					<div class="tooltip" style="transform: translate(-{pc(Date.parse(closest[0]))}%,0)">
						<span>
						{format_integers(closest[1], ",")} bytes
						({calc_percentage(closest[1], closest[2]).toFixed(2)}%)
						<br><br>
						<small>
							<b>{closest[6]}</b>
							<br>
							commited on {strftime("%Y-%m-%d", new Date(Date.parse(closest[0])))}
						</small>
						</span>
					</div>
				</Pancake.Point>
			{/if}
		</Pancake.Quadtree>
	</Pancake.Chart>
    <button on:click={saveCSV}>
        Save as CSV
    </button>
</div>

<style>
    button {
        position: absolute;
        left: 50%;
        margin-top: 3.5em;
        transform: translate(-50%, 0);
        appearance: none;
        padding: .5em 1em;
        font-family: inherit;
        font-size: .75em;
        border-radius: 8px;
        border: 1px solid #000;
        background-color: #06a;
        color: #fff;
        box-shadow: 0 -4px 0 inset #3cf;
        transition: .1s box-shadow, .1s transform;
    }
    button:active {
        transform: translate(-50%, 4px);
        box-shadow: 0 0 0 inset #3cf;
    }
	#chart {
		height: 30em;
		max-width: 50em;
		margin: auto;
		padding: 0 3em 4em 3em;
		font-family: "Star Beast", sans-serif;
		clip-path: none;
		border: white 1em solid;
		border-image: url("/border.png") 33%;
		background: white;
        padding-bottom: 7.5em;
	}

	.grid-line {
		position: relative;
		display: block;
	}

	.grid-line.horizontal {
		width: calc(100% + 2em);
		left: -2em;
		border-bottom: 1px dashed #444;
		animation: .4s width both;
		animation-delay: .2s;
	}

	@keyframes width {
		from { width: 0; }
		to   { width: calc(100% + 2em); }
	}

	.grid-line.vertical {
		height: 100%;
		border-left: 1px dashed #444;
		animation: .4s height both;
		animation-delay: .2s;
	}

	@keyframes height {
		from { height: 0; }
		to   { height: 100%; }
	}

	.grid-line.first {
		border-bottom: 1px solid #333;
	}

	.grid-line span {
		position: absolute;
		left: 0;
		bottom: 2px;
		color: #222;
		font-size: .6em;
		white-space: nowrap;
	}

	.year-label {
		position: absolute;
		width: 4em;
		left: -2em;
		bottom: -4em;
		font-size: 14px;
		color: #444;
		text-align: center;
		font-size: .5em;
	}

	@media screen and (max-width: 56em) {
		.year-label {
			display: none;
		}
	}

	path.data {
		stroke: #000;
		stroke-linejoin: round;
		stroke-linecap: round;
		stroke-width: 2px;
		fill: none;
		stroke-dashoffset: 1;
		stroke-dasharray: 1;
		animation: 6s draw-path-in cubic-bezier(.12,.01,0,.58) both;
		animation-delay: .4s;
	}
	@keyframes draw-path-in {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}


	path.highlight {
		stroke: #000;
		stroke-linejoin: round;
		stroke-linecap: round;
		stroke-width: 9px;
		fill: none;
	}

	.tooltip {
		position: absolute;
		width: 12em;
		bottom: 2em;
		background-color: #fff;
		line-height: 1.5;
		box-shadow: 10px 10px 0 rgba(0,0,0,.3);
		border: 1px solid #000;
		font-size: .8em;
		padding: .5em;
	}
</style>
