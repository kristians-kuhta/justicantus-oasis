// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class OwnershipTransferred extends ethereum.Event {
  get params(): OwnershipTransferred__Params {
    return new OwnershipTransferred__Params(this);
  }
}

export class OwnershipTransferred__Params {
  _event: OwnershipTransferred;

  constructor(event: OwnershipTransferred) {
    this._event = event;
  }

  get previousOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class RegistrationCreated extends ethereum.Event {
  get params(): RegistrationCreated__Params {
    return new RegistrationCreated__Params(this);
  }
}

export class RegistrationCreated__Params {
  _event: RegistrationCreated;

  constructor(event: RegistrationCreated) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get resourceType(): i32 {
    return this._event.parameters[1].value.toI32();
  }

  get requestId(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class ResourceRegistered extends ethereum.Event {
  get params(): ResourceRegistered__Params {
    return new ResourceRegistered__Params(this);
  }
}

export class ResourceRegistered__Params {
  _event: ResourceRegistered;

  constructor(event: ResourceRegistered) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get resourceType(): i32 {
    return this._event.parameters[1].value.toI32();
  }

  get id(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get data(): string {
    return this._event.parameters[3].value.toString();
  }
}

export class Platform extends ethereum.SmartContract {
  static bind(address: Address): Platform {
    return new Platform("Platform", address);
  }

  artistIds(account: Address): BigInt {
    let result = super.call("artistIds", "artistIds(address):(uint256)", [
      ethereum.Value.fromAddress(account)
    ]);

    return result[0].toBigInt();
  }

  try_artistIds(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("artistIds", "artistIds(address):(uint256)", [
      ethereum.Value.fromAddress(account)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  artistNames(id: BigInt): string {
    let result = super.call("artistNames", "artistNames(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(id)
    ]);

    return result[0].toString();
  }

  try_artistNames(id: BigInt): ethereum.CallResult<string> {
    let result = super.tryCall("artistNames", "artistNames(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(id)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  getArtistId(account: Address): BigInt {
    let result = super.call("getArtistId", "getArtistId(address):(uint256)", [
      ethereum.Value.fromAddress(account)
    ]);

    return result[0].toBigInt();
  }

  try_getArtistId(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArtistId",
      "getArtistId(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getArtistName(account: Address): string {
    let result = super.call(
      "getArtistName",
      "getArtistName(address):(string)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toString();
  }

  try_getArtistName(account: Address): ethereum.CallResult<string> {
    let result = super.tryCall(
      "getArtistName",
      "getArtistName(address):(string)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  getArtistSongId(artist: Address, songIndex: BigInt): BigInt {
    let result = super.call(
      "getArtistSongId",
      "getArtistSongId(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(artist),
        ethereum.Value.fromUnsignedBigInt(songIndex)
      ]
    );

    return result[0].toBigInt();
  }

  try_getArtistSongId(
    artist: Address,
    songIndex: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArtistSongId",
      "getArtistSongId(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(artist),
        ethereum.Value.fromUnsignedBigInt(songIndex)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getArtistSongsCount(artist: Address): BigInt {
    let result = super.call(
      "getArtistSongsCount",
      "getArtistSongsCount(address):(uint256)",
      [ethereum.Value.fromAddress(artist)]
    );

    return result[0].toBigInt();
  }

  try_getArtistSongsCount(artist: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArtistSongsCount",
      "getArtistSongsCount(address):(uint256)",
      [ethereum.Value.fromAddress(artist)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSongUri(songId: BigInt): string {
    let result = super.call("getSongUri", "getSongUri(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(songId)
    ]);

    return result[0].toString();
  }

  try_getSongUri(songId: BigInt): ethereum.CallResult<string> {
    let result = super.tryCall("getSongUri", "getSongUri(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(songId)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _vrfCoordinator(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _subscriptionId(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _keyHash(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class RawFulfillRandomWordsCall extends ethereum.Call {
  get inputs(): RawFulfillRandomWordsCall__Inputs {
    return new RawFulfillRandomWordsCall__Inputs(this);
  }

  get outputs(): RawFulfillRandomWordsCall__Outputs {
    return new RawFulfillRandomWordsCall__Outputs(this);
  }
}

export class RawFulfillRandomWordsCall__Inputs {
  _call: RawFulfillRandomWordsCall;

  constructor(call: RawFulfillRandomWordsCall) {
    this._call = call;
  }

  get requestId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get randomWords(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class RawFulfillRandomWordsCall__Outputs {
  _call: RawFulfillRandomWordsCall;

  constructor(call: RawFulfillRandomWordsCall) {
    this._call = call;
  }
}

export class RegisterArtistCall extends ethereum.Call {
  get inputs(): RegisterArtistCall__Inputs {
    return new RegisterArtistCall__Inputs(this);
  }

  get outputs(): RegisterArtistCall__Outputs {
    return new RegisterArtistCall__Outputs(this);
  }
}

export class RegisterArtistCall__Inputs {
  _call: RegisterArtistCall;

  constructor(call: RegisterArtistCall) {
    this._call = call;
  }

  get name(): string {
    return this._call.inputValues[0].value.toString();
  }
}

export class RegisterArtistCall__Outputs {
  _call: RegisterArtistCall;

  constructor(call: RegisterArtistCall) {
    this._call = call;
  }
}

export class RegisterSongCall extends ethereum.Call {
  get inputs(): RegisterSongCall__Inputs {
    return new RegisterSongCall__Inputs(this);
  }

  get outputs(): RegisterSongCall__Outputs {
    return new RegisterSongCall__Outputs(this);
  }
}

export class RegisterSongCall__Inputs {
  _call: RegisterSongCall;

  constructor(call: RegisterSongCall) {
    this._call = call;
  }

  get uri(): string {
    return this._call.inputValues[0].value.toString();
  }
}

export class RegisterSongCall__Outputs {
  _call: RegisterSongCall;

  constructor(call: RegisterSongCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall extends ethereum.Call {
  get inputs(): RenounceOwnershipCall__Inputs {
    return new RenounceOwnershipCall__Inputs(this);
  }

  get outputs(): RenounceOwnershipCall__Outputs {
    return new RenounceOwnershipCall__Outputs(this);
  }
}

export class RenounceOwnershipCall__Inputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall__Outputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class TransferOwnershipCall extends ethereum.Call {
  get inputs(): TransferOwnershipCall__Inputs {
    return new TransferOwnershipCall__Inputs(this);
  }

  get outputs(): TransferOwnershipCall__Outputs {
    return new TransferOwnershipCall__Outputs(this);
  }
}

export class TransferOwnershipCall__Inputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }

  get newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOwnershipCall__Outputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }
}
