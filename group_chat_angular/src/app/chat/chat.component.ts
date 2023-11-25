import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AwsWebSocketService} from "../services/aws.web-socket.service";
import {AwsHttpService} from "../services/aws-http.service";
import {MessageDto} from "../models/message.dto";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  @Input() username: string = '';
  @Input() groupId: string = '';

  messages: MessageDto[] = [];
  messageForm = new FormControl('');



  constructor(private awsWebSocketService: AwsWebSocketService, private awsHttpService: AwsHttpService) {
  }

  ngOnInit() {
    this.awsWebSocketService.connect();
    this.awsWebSocketService.selectUsername(this.username);
    this.awsWebSocketService.selectGroup(this.groupId);

    this.awsHttpService.getMessagesByGroupId(this.groupId).subscribe({
      next: (response: any) => {
        this.messages = response;
      },
      error: (error) => {
        console.log(error)
      }
    });

    this.awsWebSocketService.getMessagesObservable().subscribe((message) => {
      const newMessage: MessageDto = {
        username: message.username,
        message: message.message,
        groupId: this.groupId,
        dateTime: new Date().toISOString(),
        connectionId: ''
      }
      this.messages.push(newMessage);
      console.log(message);
      this.scrollToBottom();
    })
  }

  sendMessage() {
    this.awsWebSocketService.sendMessageToGroup(this.messageForm.value!);
  }

  ngOnDestroy() {
    this.awsWebSocketService.close();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch(err) {
        console.log(err);
      }
    }, 500);
  }
}
