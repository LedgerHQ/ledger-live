// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract SimpleContract {
    struct Struct3 {
        address[] addresses;
    }

    struct Struct2 {
        Struct3 param3;
    }

    struct Struct1 {
        Struct2[] param2;
    }

    struct ComplexStruct {
        address address1;
        Struct1 param1;
    }

    function singleParam(address fromToken) public {
        // Do nothing
    }

    function multipleParams(address fromToken, address toToken) public {
        // Do nothing
    }

    function arrayParam(address[] calldata fromToken) public {
        // Do nothing
    }

    function complexStructParam(ComplexStruct calldata complexStruct) public {
        // Do nothing
    }
}
