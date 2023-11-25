import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {GroupDto} from "../models/group.dto";
import {MessageDto} from "../models/message.dto";

@Injectable({
  providedIn: 'root'
})
export class AwsHttpService {

  baseUrl: string = "https://0ieouzc60a.execute-api.us-east-1.amazonaws.com/dev";

  constructor(private http: HttpClient) {
  }

  public getGroupsByUserName(userName: string): Observable<GroupDto[]> {
    return this.http.get<GroupDto[]>(`${this.baseUrl}/groups/user/${userName}`);
  }

  public getMessagesByGroupId(groupId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/groups/messages/${groupId}`);
  }
}
