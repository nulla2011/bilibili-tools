declare namespace live {
  function getRoomID(input: string): number;
}
declare class Room {
  id: number;
  live_status?: number;
  title: string;
  uname: string;
  constructor(ID: number);
  getInfo();
  getUserInfo();
}
export { getRoomID, Room };