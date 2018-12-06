import { Injectable, OnInit } from '@angular/core';
import { SnackBarService } from 'ng7-snack-bar';
import { ICookieUser } from 'src/mapping/ICookieUser';
declare var $: any;

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    private readonly CONNECTION_LINK: string = 'http://localhost:8080/backend/signalr';
    private connection: any;
    private hub: any;

    constructor(
        private notificationService: SnackBarService,
    ) { }

    configureWebsocket(): void {
        if (this.connection != null && this.connection !== undefined) {
            console.log('Called configureWebsocket when its already configured.');
            return;
        }

        const that = this;

        this.connection = $.hubConnection(this.CONNECTION_LINK, { useDefaultPath: false });
        this.hub = this.connection.createHubProxy('mainHub');

        this.hub.on('addContosoChatMessageToPage', function (bla) {
            console.log('From backend:');
            console.log(bla);
        });

        this.hub.on('onReceiveFriendRequest', function (newFriendRuquestName) {
            console.log('hey' + newFriendRuquestName);
            that.onNotification(newFriendRuquestName);
        });


        this.connection.start()
            .done(function () {
                console.log('Now connected, connection ID=' + that.connection.id);
                console.log(that.connection);
                that.onSetNewCookie();
            })
            .fail(function () { console.log('Could not connect'); });
    }


    onAddFriend(userId: number): void {
        const that = this;
        this.hub.invoke('AddFriend', this.getCurrentUserCookie().Cookie, userId).done(function () {
            console.log('Addfriend gelukt' + that.getCurrentUserCookie().Cookie + 'USER: ' + userId);
        }).fail(function (error) { console.log(error); });
    }

    onNotification(newFriendRuquestName): void {
        console.log(newFriendRuquestName);
        console.log(this.notificationService);
        alert(`Gebruiker ${newFriendRuquestName} heeft een vriendenverzoek verstuurd naar je!`);
    }

    onSetNewCookie(): void {
        if (this.getCurrentUserCookie() == null) {
            return;
        }

        this.hub.invoke('OnStartConnection', this.getCurrentUserCookie().Cookie).done(function () {
            console.log('Invocation of NewContosoChatMessage succeeded');
        }).fail(function (error) {
            console.log('Invocation of NewContosoChatMessage failed. Error: ' + error);
        });
    }

    getCurrentUserCookie(): ICookieUser {
        if (localStorage.getItem('user-cookie')) {
            return JSON.parse(localStorage.getItem('user-cookie'));
        } else {
            return null;
        }
    }
}
