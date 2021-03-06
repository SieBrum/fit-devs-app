import { Component } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { AppService } from '../app.service';
import { ActivatedRoute } from '@angular/router';
import { IUserFlat, FriendRequestStatus } from 'src/mapping/IUserFlat';
import { WebsocketService } from '../websocket.service';
import { MatSnackBar } from '@angular/material';

@Component({
    selector: 'app-search',
    templateUrl: './app-search-page.component.html',
    styleUrls: ['./app-search-page.component.sass']
})
export class AppSearchPageComponent {
    searchQuery: '';
    receivedData: Array<IUserFlat> = [];
    isLoading = false;
    displayedColumns = ['Gebruikersnaam', 'Naam', 'Geboortedatum', 'Acties'];


    constructor(
        private authenticationService: AuthenticationService,
        private appService: AppService,
        private activatedRoute: ActivatedRoute,
        private notificationService: MatSnackBar,
        private webSocketService: WebsocketService
    ) {
        this.activatedRoute.queryParams.subscribe(
            (resp) => {
                this.searchQuery = resp['query'];
                this.onSearch();
            }
        );

    }

    onSearch(): void {
        if (!this.searchQuery) {
            return;
        }
        this.isLoading = true;

        setTimeout(() => {
            this.appService.getUsersByUsername(this.searchQuery).subscribe(
                (resp) => {
                    this.isLoading = false;
                    resp.body.forEach(element => {
                        element.DateOfBirth = this.toReadableDate(element.DateOfBirth.toString()) as unknown as Date;
                    });
                    this.receivedData = resp.body;
                },
                (err) => {
                    if (err.status === 401) {
                        this.authenticationService.logout('/profile');
                    } else {
                        this.notificationService.open(`Er is iets mis gegaan! ${err.error.Message}`, null, {
                            panelClass: 'error-snack',
                            duration: 2500
                        });
                    }
                    this.isLoading = false;
                }
            );
        }, 1000);
    }


    toReadableDate(date: string): string {
        if (!date) {
            return '';
        }
        date = date.substring(0, date.length - 9);

        const newDate = new Date(date);
        return `${newDate.getUTCDate()}-${newDate.getMonth() + 1}-${newDate.getFullYear()}`;
    }

    hasResults(data: Array<IUserFlat>) {
        return data.length > 0 ? true : false;
    }

    onLookupUser(user: IUserFlat): void {
        alert('Deze functionaliteit werkt nog niet :(');
    }

    onUserAdd(user: IUserFlat): void {
        this.appService.addFriend(user.Id).subscribe(
            (resp) => {
                this.notificationService.open(`Gebruiker '${user.Username}' toegevoegd!`, null, {
                    panelClass: 'success-snack',
                    duration: 2500
                });
                this.webSocketService.onAddFriend(user.Id);
                if (user.HasRequestOpen === FriendRequestStatus.None) {
                    user.HasRequestOpen = FriendRequestStatus.HasSend;
                } else {
                    user.HasRequestOpen = FriendRequestStatus.AreFriends;
                }
            },
            (err) => {
                if (err.status === 401) {
                    this.authenticationService.logout('/profile');
                } else {
                    this.notificationService.open(`Er is iets mis gegaan! ${err.error.Message}`, null, {
                        panelClass: 'error-snack',
                        duration: 2500
                    });
                }
            }
        );
    }

    onRemoveUser(user: IUserFlat): void {
        this.appService.removeFriend(user.Id).subscribe(
            (resp) => {
                if (user.HasRequestOpen === FriendRequestStatus.AreFriends) {
                    this.notificationService.open(`Gebruiker '${user.Username}' verwijderd!`, null, {
                        panelClass: 'success-snack',
                        duration: 2500
                    });
                } else {
                    this.notificationService.open(`Gebruiker '${user.Username}' gewijgerd!`, null, {
                        panelClass: 'success-snack',
                        duration: 2500
                    });
                }
                user.HasRequestOpen = FriendRequestStatus.None;
            },
            (err) => {
                if (err.status === 401) {
                    this.authenticationService.logout('/profile');
                } else {
                    this.notificationService.open(`Er is iets mis gegaan! ${err.error.Message}`, null, {
                        panelClass: 'error-snack',
                        duration: 2500
                    });
                }
            }
        );
    }
}
