declare namespace live {
  function getRoomID(input: string): number;
}
declare class Room {
  id: number;
  live_status: number;
  title: string;
  uname: string;
  live_time: string;
  uface: string;
  online: number;
  constructor(ID: number);
  getInfo();
  getUserInfo();
}
export { getRoomID, Room };