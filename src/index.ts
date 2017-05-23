import {readdir, readdirSync, stat, Stats, statSync} from 'fs';
import {resolve as resolvePath} from 'path';


function readDirectory(directory: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        readdir(directory, (err, files) => {
            if(err) return reject(err);
            resolve(files.map(file => resolvePath(directory, file)));
        });
    });
}

function statistics(path: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
        stat(path, (err, statistics) => {
            if(err) return reject(err);
            resolve(statistics);
        });
    });
}

function matchesExtension(file: string, extension: string | RegExp): boolean {
    if(typeof extension === 'string') {
        if(file.endsWith(extension)) return file as any;
    } else if(extension instanceof RegExp) {
        if(file.match(extension)) return file as any;
    } else {
        throw new Error('Extension must be a string or a regular expression!');
    }
}

export function listFiles(directory: string, extension?: string | RegExp): Promise<string[]> {
    if(typeof extension === 'string' && !extension.startsWith('.')) extension = `.${extension}`;
    return readDirectory(directory)
        .then(files => Promise.all(files.map(file => statistics(file)
            .then(stats => {
                if(stats.isDirectory()) return listFiles(file, extension);
                if(!extension || (extension && matchesExtension(file, extension))) return file as any;
            }))))
        .then(files => Array.prototype.concat.apply([], files).filter(file => !!file));
}

export function listFilesSync(directory: string, extension?: string | RegExp, files: string[] = []): string[] {
    if(typeof extension === 'string' && !extension.startsWith('.')) extension = `.${extension}`;

    for(let file of readdirSync(directory)) {
        file = resolvePath(directory, file);

        if(statSync(file).isDirectory()) {
            files = listFilesSync(file, extension, files);
        } else if(!extension || (extension && matchesExtension(file, extension))) {
            files.push(file);
        }
    }

    return files;
}
