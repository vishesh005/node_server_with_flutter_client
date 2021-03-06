import {Note} from "../models/note_model";
import { validate as uuidValidate } from 'uuid';

const INVALID_REQUEST = "Invalid request";


const message_title =   "Please provide title of the note";
const message_content = "Please provide content of the note";
const message_id = "Please provide note id";

export class Notes_validator {

    validateCreateNoteRequest(request: any): any {
      const notes = {title: message_title, content: message_content};
      const message = this.#getUndefinedMessage(request,notes);
      if(message != undefined){
          return [{validation: INVALID_REQUEST, message: message}];
      }
      if(typeof request.title != "string"){
          return [{validation: INVALID_REQUEST, message: "Please provide valid note title"}];
      }
      if(typeof request.content != "string" || request.content.length < 10){
          return [{validation: INVALID_REQUEST, message: "Content of the note should be in text format and have atleast 10 characters"}];
      }
    }

    #getUndefinedMessage(data:object ,map: object){
        let keys = Object.keys(map);
        for (let i = 0;i< keys.length;i++){
           if(!(keys[i] in data)){
              return map[keys[i]];
           }
        }
    }


    validateAllNotes(request: any){
        if(request.skipRecords != undefined && !Array.isArray(request.skipRecords)){
            return [{validation: INVALID_REQUEST, message: "Skipping records should be an array of ids"}];
        }
        if(request.recordsCount != undefined && (typeof request.recordsCount != "number")){
            return [{validation: INVALID_REQUEST, message: "Requested records count should be number"}];
        }
    }

    validateNoteId(noteId:string){
        if(typeof noteId != "string" || !uuidValidate(noteId)){
          return [{validation: INVALID_REQUEST, message: "Provided note id is not valid"}];
        }
    }

    validateNoteIdsFromArray(array: any) : any  {
        if(array == undefined || !Array.isArray(array) || array.length < 1){
            return [{validation: INVALID_REQUEST, message: "Requested note ids are not valid"}];
        }
        const invalidIds = [];
        const messages = [];
        for(let i = 0;i < array.length ;i++){
             let message = this.validateNoteId(array[i]);
             if(message != undefined){
                 messages.push({errorValidation: message, id: array[i]});
                 invalidIds.push(array[i]);
             }
        }

        return {
            ids: invalidIds,
            messages: messages
        };
    }

    validateNotesFromArray(array: any) : any  {
        if(array == undefined || !Array.isArray(array) || array.length < 1){
            return [{validation: INVALID_REQUEST, message: "Patch requested notes are not valid"}];
        }
        const invalidNotes = [];
        const messages = [];
        for(let i = 0;i < array.length ;i++){
            let message = this.validatePatchNoteRequest(array[i])
            if(message != undefined){
                messages.push({errorValidation: message, id: array[i]});
                invalidNotes.push(array[i]);
            }
        }

        if(invalidNotes.length > 0) {
            return {
                invalidNotes: invalidNotes,
                messages: messages
            };
        }
    }

    validatePatchNoteRequest(note: any) : any{
        if(note == undefined){
            return [{validation: INVALID_REQUEST, message: "Provided patch note is not valid"}];
        }
        else if(note.title == undefined && note.content == undefined){
            return [{validation: INVALID_REQUEST, message: `Patch note doesn't contain title or content`}];
        }
        else if(note.title == undefined && note.content == undefined){
            return [{validation: INVALID_REQUEST, message: `Patch note doesn't contain title or content`}];
        }
        else if(this.validateNoteId(note.note_id) != undefined){
            return [{validation: INVALID_REQUEST, message: `Patch note doesn't contain valid id`}];
        }
        else{
            return undefined;
        }
    }
}
