import sharp from "sharp";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import pLimit from "p-limit";

async function convertToAvif(filePath:string) {
	try {
		const { dir, name, ext } = path.parse(filePath),
			outputFilePath = path.normalize(`${dir}${path.sep}${name}${ext}.avif`);

		await sharp(filePath)
			.avif({lossless: true, quality: 100, effort: 9})
			.toFile(outputFilePath);
		console.log(`Converted ${filePath} to ${outputFilePath}`);
	} catch (error) {
		console.error(`Error converting ${filePath}: ${error.message}`);
	}
}

const processStdin = (): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		let data = '';
		process.stdin.on('data', (chunk) => {
			data += chunk.toString();
		});
		process.stdin.on('end', () => {
			resolve(data);
		});
		process.stdin.on('error', (err) => {
			reject(err);
		});
	});
};

const fileList = (await processStdin()) // Piped input
	.split("\n")
	.concat(process.argv.splice(2)) // Argument input
	.map((line) => path.join(process.cwd(), line))
	.filter(filePath => /\.(jpe?g|png|gif|webp)$/.test(filePath));

const queue = pLimit(os.cpus().length),
	promiseList:Promise<void>[] = []
;
for (let filePath of fileList) {
	promiseList.push(queue(async () => {
		await convertToAvif(filePath);
	}));
}
await Promise.allSettled(promiseList);
