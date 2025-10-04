export namespace Core {
	
	export class CoreFile {
	    Path: string;
	    Name: string;
	    Size: number;
	    Permission: number;
	
	    static createFrom(source: any = {}) {
	        return new CoreFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Name = source["Name"];
	        this.Size = source["Size"];
	        this.Permission = source["Permission"];
	    }
	}

}

