import { exec } from 'child_process';
import path from 'path';
const biomePlugin = (options = {}) => {
    const executeCommand = async () => {
        const filesPath = path.join(process.cwd(), options.files ?? ".").replace(/(\\\s+)/g, '\\\\$1');
        const command = [
            options.biomeCommandBase ?? 'npx @biomejs/biome',
            options.mode ?? 'lint',
            `"${filesPath}"`,
            (options.forceColor ?? true) && '--colors=force',
            options.diagnosticLevel && `--diagnostic-level=${options.diagnosticLevel}`,
            options.logKind && `--log-kind=${options.logKind}`,
            options.applyFixes && '--write',
            options.applyFixes && options.unsafe && '--unsafe',
            options.biomeAdditionalArgs,
        ]
            // remove excluded args
            .filter((a) => !!a)
            .join(" ");
        return new Promise((resolve, reject) => {
            exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (stderr) {
                    console.error(`Biome Stderr:\n${stderr}`);
                }
                if (stdout) {
                    console.log(`Biome Output:\n${stdout}`);
                }
                if (error) {
                    console.log(error.code);
                    if (!stderr.includes("lint/style")) {
                        console.error(`Biome Execution Error: ${error.message}`);
                    }
                    if (options.failOnError)
                        reject(`Build failed due to Biome errors.`);
                }
                resolve();
            });
        });
    };
    const debounce = (func, wait) => {
        let timeout = null;
        return (...args) => {
            const context = this;
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    };
    const debouncedExecuteCommand = debounce(executeCommand, 500);
    return {
        name: 'vite-plugin-biome',
        async buildStart() {
            await executeCommand();
        },
        async handleHotUpdate() {
            debouncedExecuteCommand();
        },
    };
};
export default biomePlugin;
