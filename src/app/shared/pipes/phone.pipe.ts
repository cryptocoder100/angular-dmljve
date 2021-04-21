import { Pipe, PipeTransform } from '@angular/core';



// Prasad - 06/30
@Pipe({
  name: 'phoneMask'
})
export class PhonePipe implements PipeTransform {
  transform(phoneData: string): string {
    if (!phoneData) { return ''; }

    const value = phoneData.toString().trim().replace(/^\+/, '');

    if (value.match(/[^0-9]/)) {
        return phoneData;
    }

    let country: string;
    let city: string;
    let num: string;

    switch (value.length) {
        case 10: // +1PPP####### -> C (PPP) ###-####
            country = '1';
            city = value.slice(0, 3);
            num = value.slice(3);
            break;

        case 11: // +CPPP####### -> CCC (PP) ###-####
            country = value[0];
            city = value.slice(1, 4);
            num = value.slice(4);
            break;

        case 12: // +CCCPP####### -> CCC (PP) ###-####
            country = value.slice(0, 3);
            city = value.slice(3, 5);
            num = value.slice(5);
            break;

        default:
            return phoneData;
    }

    if (country === '1') {
        country = '';
    }

    num = num.slice(0, 3) + '-' + num.slice(3);

    return (`${country} (${city}) ${num}`).trim();
  }
}

