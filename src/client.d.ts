///<reference


class KeysInit {
    declare private Client;

    public leftArrow(): void;
    public rightArrow(): void;
    public backspace(): void;
    public enter(): void;
    
    private appendChar(char:string | object, data:object): void;
    private keyTriggerCallback(key:string, matches:any, data:any): void;

    public displayMessage(message:string): void;
}

class BehemothClient {
    declare protected TextBuffer:string[];
    declare protected LineIndex:number;
    declare protected MenuObject:string;
    declare protected Keys;
    declare protected Settings;
    declare protected Socket;

    public appendInformation(): Promise<void>;
} 


module.exports = {BehemothClient, KeysInit};