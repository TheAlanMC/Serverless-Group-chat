import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GroupListComponent } from './group-list/group-list.component';
import { ChatComponent } from './chat/chat.component';
import {ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    AppComponent,
    GroupListComponent,
    ChatComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
      HttpClientModule

    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
