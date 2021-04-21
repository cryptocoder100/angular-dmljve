import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'filterListString'
})
export class FilterList implements PipeTransform {
    transform(users: string[], searchTerm: string): string[] {

        if (!users || !searchTerm) {
            return users;
        }
        return users.filter(usr => usr.toLowerCase().indexOf(searchTerm.toLowerCase().trim()) !== -1);
    }
}

