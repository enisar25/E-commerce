import { EventEmitter } from 'events';
import { sendEmail } from './sendEmail';

export enum EmailEventsEnum {
    VERIFY_EMAIL = 'VERIFY_EMAIL',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

export class EmailEvents {
    constructor(private readonly emitter: EventEmitter) {}

    subscribe = (event : EmailEventsEnum, callback: (payload: any) => void) => {
        this.emitter.on(event, callback);
    }

    publish = (event : EmailEventsEnum, payload: any) => {
        this.emitter.emit(event, payload);
    }
}

const emailEventEmitter = new EventEmitter();
const emailEmmiter = new EmailEvents(emailEventEmitter);

emailEmmiter.subscribe(EmailEventsEnum.VERIFY_EMAIL, ({to,subject,html}:{to:string,subject:string,html:string}) => {
    void sendEmail({ to, subject, html });
});

export { emailEmmiter };



