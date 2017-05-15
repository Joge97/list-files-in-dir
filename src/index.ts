import * as fs from 'fs';
import * as path from 'path';


export function listFiles(directory: string, extension?: string): Promise<string[]> {
    extension = extension.startsWith('.') ? extension : `.${extension}`;
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, currentFiles) => {
            if(err) return reject(err);
            resolve(currentFiles.map(file => {
                file = path.resolve(directory, file);
                return new Promise((statResolve, statReject) => {
                    fs.stat(file, (statErr, stat) => {
                        if(statErr) return statReject(statErr);
                        if(stat.isDirectory()) {
                            statResolve(listFiles(file, extension));
                        } else if(extension && file.endsWith(extension)) {
                            statResolve(file);
                        } else {
                            statResolve();
                        }
                    });
                });
            }));
        });
    })
        .then(promises => Promise.all(Array.prototype.concat.apply([], promises)))
        .then(files => Array.prototype.concat.apply([], files).filter(file => !!file));
}

export function listFilesSync(directory: string, extension?: string, files: string[] = []): string[] {
    extension = extension.startsWith('.') ? extension : `.${extension}`;
    for(let file of fs.readdirSync(directory)) {
        file = path.resolve(directory, file);

        if(fs.statSync(file).isDirectory()) {
            files = listFilesSync(file, extension, files);
        } else if(extension && file.endsWith(extension)) {
            files.push(file);
        }
    }

    return files;
}
