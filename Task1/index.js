function optimizeBookings(bookings) {
    if (bookings.length === 0)return [];

     bookings.sort((a, b) => a[0] - b[0]);

    
    const ans = [bookings[0]];

    
    for (let i = 1; i < bookings.length; i++) {
        const lastBooking = ans[ans.length - 1];
        const currentBooking = bookings[i];

        if (currentBooking[0] <= lastBooking[1]) {
          
            lastBooking[1] = Math.max(lastBooking[1], currentBooking[1]);
        } else {
           
            ans.push(currentBooking);
        }
    }

    return ans;
}


const bookings = [[9, 12], [11, 13], [14, 17], [16, 18]];
console.log(optimizeBookings(bookings)); 
