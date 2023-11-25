import { Component } from '@angular/core';
import {GroupDto} from "../models/group.dto";
import {AwsHttpService} from "../services/aws-http.service";
import {FormControl} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent {
  groups: GroupDto[] = [];
  selectedGroupId: string = '';
  username = '';
  usernameForm = new FormControl('');
  constructor(private awsHttpService: AwsHttpService) {
  }


  getGroups() {
    this.awsHttpService.getGroupsByUserName(this.usernameForm.value!).subscribe({
      next: (response: any) => {
        this.groups = response;
      },
      error: (error) => {
        console.log(error)
      }
    })
  }

  openGroup(groupId: string) {
    console.log(groupId);
    this.selectedGroupId = groupId;
    this.username = this.usernameForm.value!;
  }

}
