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

export namespace scanner {
	
	export class FileType {
	    Name: string;
	    Path: string;
	    Ext: string;
	    Mime: string;
	    Size: number;
	    Content: string;
	
	    static createFrom(source: any = {}) {
	        return new FileType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Path = source["Path"];
	        this.Ext = source["Ext"];
	        this.Mime = source["Mime"];
	        this.Size = source["Size"];
	        this.Content = source["Content"];
	    }
	}

}

