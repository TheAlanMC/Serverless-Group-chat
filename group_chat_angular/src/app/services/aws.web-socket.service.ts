import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {Router} from "@angular/router";
import {from, Subject} from "rxjs";
import {SelectGroupDtoWs} from "../models/select.group.dto.ws";
import {SelectUsernameDtoWs} from "../models/select.username.dto.ws";
import {MessageWsDto} from "../models/message.ws.dto";

export interface Message {
  action: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsWebSocketService {
  private wsUrl = "wss://me08557yf3.execute-api.us-east-1.amazonaws.com/dev"
  private socket$!: WebSocketSubject<any>;
  messageSubject = new Subject<MessageWsDto>();

  public connect(): void {
    console.log('connect')
    if(!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.wsUrl);

      this.socket$.subscribe((data: MessageWsDto) => {
        console.log(data);
        this.messageSubject.next(data);
      });
    }
  }

  selectUsername(username: string) {
    const message: SelectUsernameDtoWs  = {
      action: 'selectUsername',
      username
    }
    this.socket$.next(message);
  }

  selectGroup(groupId: string) {
    const message: SelectGroupDtoWs = {
      action: 'selectGroup',
      groupId
    }
    this.socket$.next(message);
  }

  sendMessageToGroup(message: string) {
    const messageToSend = {
      action: 'sendMessageToGroup',
      message
    }
    this.socket$.next(messageToSend);
  }

  getMessagesObservable() {
    return this.messageSubject.asObservable();
  }

  close() {
    this.socket$.complete();
  }
}
